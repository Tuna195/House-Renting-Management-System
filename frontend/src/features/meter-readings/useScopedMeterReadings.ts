/** Quản lý bản nháp và request lưu độc lập theo tòa nhà/tháng, bảo vệ chỉnh sửa mới trước phản hồi cũ. */
import { useReducer, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meterApi, type Reading } from '../../api/meter-readings';
import { readMeterError, type MeterFieldErrors } from './meterReadingErrors';
import type { ReadingDrafts, ReadingField, ReadingValue } from './meterReadings.utils';

interface DraftScope {
  version: number;
  drafts: ReadingDrafts;
  saving: boolean;
  fieldErrors: MeterFieldErrors;
  error?: string;
}

export interface SaveVariables {
  scopeKey: string;
  version: number;
  buildingId: number;
  period: string;
  readings: Reading[];
}

type ScopeState = Record<string, DraftScope>;
type ScopeAction =
  | { type: 'edit'; scopeKey: string; roomId: number; field: ReadingField; value: ReadingValue | null }
  | { type: 'start' | 'finish'; scopeKey: string }
  | { type: 'saved'; scopeKey: string; version: number }
  | { type: 'failed'; scopeKey: string; version: number; fieldErrors: MeterFieldErrors; error: string };

const EMPTY_SCOPE: DraftScope = { version: 0, drafts: {}, saving: false, fieldErrors: {} };

/** Giữ version tăng theo mỗi chỉnh sửa; không tái sử dụng version sau khi dọn bản nháp. */
function scopeReducer(state: ScopeState, action: ScopeAction): ScopeState {
  const scope = state[action.scopeKey] ?? EMPTY_SCOPE;
  let next: DraftScope;
  switch (action.type) {
    case 'edit':
      next = {
        ...scope,
        version: scope.version + 1,
        fieldErrors: {},
        error: undefined,
        drafts: {
          ...scope.drafts,
          [action.roomId]: { ...scope.drafts[action.roomId], [action.field]: action.value ?? undefined },
        },
      };
      break;
    case 'start':
      next = { ...scope, saving: true, fieldErrors: {}, error: undefined };
      break;
    case 'finish':
      next = { ...scope, saving: false };
      break;
    case 'saved':
      // Phản hồi cũ chỉ được dọn đúng bản nháp đã gửi, không chạm chỉnh sửa mới hơn.
      if (scope.version !== action.version) return state;
      next = { ...scope, drafts: {}, fieldErrors: {}, error: undefined };
      break;
    case 'failed':
      if (scope.version !== action.version) return state;
      next = { ...scope, fieldErrors: action.fieldErrors, error: action.error };
      break;
  }
  return { ...state, [action.scopeKey]: next };
}

interface SaveFeedback {
  onSaved: (variables: SaveVariables) => void;
  onError: (error: unknown) => void;
}

/** Giữ bản nháp khi đổi bộ lọc và chỉ cho một request lưu đang chạy trên mỗi scope. */
export function useScopedMeterReadings(buildingId: number | undefined, period: string, feedback: SaveFeedback) {
  const [scopes, dispatch] = useReducer(scopeReducer, {});
  // Ref khóa đồng bộ trước render tiếp theo, chặn cả hai lần nhấn lưu trong cùng một tick.
  const pendingScopes = useRef(new Set<string>());
  const queryClient = useQueryClient();
  const scopeKey = buildingId === undefined ? undefined : `${buildingId}:${period}`;
  const activeScope = scopeKey === undefined ? EMPTY_SCOPE : (scopes[scopeKey] ?? EMPTY_SCOPE);

  const mutation = useMutation({
    mutationFn: (variables: SaveVariables) =>
      meterApi.save(variables.buildingId, variables.period, variables.readings),
    onSuccess: async (_response, variables) => {
      // Làm mới đúng cache trước khi bỏ bản nháp để tránh hiện lại số cũ trong lúc refetch.
      await queryClient.invalidateQueries({
        queryKey: ['meter-readings', variables.buildingId, variables.period],
        exact: true,
      });
      dispatch({ type: 'saved', scopeKey: variables.scopeKey, version: variables.version });
      feedback.onSaved(variables);
    },
    onError: async (error, variables) => {
      const failure = readMeterError(error, variables.readings);
      dispatch({ type: 'failed', scopeKey: variables.scopeKey, version: variables.version,
        fieldErrors: failure.fields, error: failure.message });
      if (failure.code === 'PERIOD_LOCKED') {
        await queryClient.invalidateQueries({
          queryKey: ['meter-readings', variables.buildingId, variables.period], exact: true,
        });
      }
      feedback.onError(error);
    },
    onSettled: (_response, _error, variables) => {
      pendingScopes.current.delete(variables.scopeKey);
      dispatch({ type: 'finish', scopeKey: variables.scopeKey });
    },
  });

  /** Sửa đúng phòng trong scope đang hiển thị; dữ liệu ở các scope khác được giữ nguyên. */
  function updateReading(roomId: number, field: ReadingField, value: ReadingValue | null) {
    if (scopeKey === undefined) return;
    dispatch({ type: 'edit', scopeKey, roomId, field, value });
  }

  /** Chụp scope, version và payload độc lập trước khi gửi; bỏ qua lần lưu trùng đang chạy. */
  function saveReadings(readings: Reading[]) {
    if (scopeKey === undefined || buildingId === undefined || pendingScopes.current.has(scopeKey)) return;
    pendingScopes.current.add(scopeKey);
    dispatch({ type: 'start', scopeKey });
    mutation.mutate({
      scopeKey,
      version: activeScope.version,
      buildingId,
      period,
      readings: readings.map((reading) => ({ ...reading })),
    });
  }

  return { fieldErrors: activeScope.fieldErrors, error: activeScope.error, drafts: activeScope.drafts, isSaving: activeScope.saving, updateReading, saveReadings };
}
