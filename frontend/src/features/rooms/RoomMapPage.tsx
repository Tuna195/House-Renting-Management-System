// Trang Sơ đồ phòng /room-map — chọn tòa nhà → các phòng xếp theo tầng (tầng cao ở trên, giống tòa nhà thật).
// Mỗi phòng là một ô màu theo trạng thái, ghi tên phòng + người đại diện; viền đỏ nếu có hóa đơn quá hạn.
// Dữ liệu lấy lại từ GET /rooms?buildingId= (backend đã include người đại diện và cờ quá hạn).
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Empty, Flex, Select, Space, Spin, Tag, Tooltip, Typography, theme } from 'antd';
import type { GlobalToken } from 'antd';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { buildingsApi } from '../../api/buildings';
import { roomsApi } from '../../api/rooms';
import type { Room, RoomStatus } from '../../types';
import { formatVND } from '../../utils/format';
import { ROOM_STATUS } from '../../utils/status';
import { compareText } from '../../utils/table';

const NO_FLOOR = 'none'; // khóa nhóm cho phòng chưa ghi tầng

/** Gom phòng theo tầng: [{ floor: 3, rooms }, { floor: 2, rooms }, ..., { floor: 'none', rooms }] */
function groupByFloor(rooms: Room[]) {
  const groups = rooms.reduce<Record<string, Room[]>>((acc, room) => {
    const key = room.floor == null ? NO_FLOOR : String(room.floor);
    (acc[key] ??= []).push(room);
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([key, items]) => ({
      floor: key === NO_FLOOR ? null : Number(key),
      rooms: items.sort((a, b) => compareText(a.name, b.name)), // P101, P102, ..., P110
    }))
    .sort((a, b) => (b.floor ?? -1) - (a.floor ?? -1)); // tầng cao lên trên, "chưa ghi tầng" xuống cuối
}

const floorLabel = (floor: number | null) =>
  floor == null ? 'Chưa ghi tầng' : floor === 0 ? 'Tầng trệt' : `Tầng ${floor}`;

/** Màu của Tag ('green', 'blue'...) → mã màu nền nhạt (green1) và màu viền (green6) theo theme */
function statusColors(token: GlobalToken, status: RoomStatus) {
  const name = ROOM_STATUS[status].color;
  return {
    background: token[`${name}1` as keyof GlobalToken] as string,
    border: token[`${name}6` as keyof GlobalToken] as string,
  };
}

function RoomTile({ room }: { room: Room }) {
  const { token } = theme.useToken();
  const { background, border } = statusColors(token, room.status);
  const overdue = room.hasOverdueInvoice;

  const tooltip = (
    <>
      <div>Giá thuê: {formatVND(room.baseRent)}</div>
      <div>Trạng thái: {ROOM_STATUS[room.status].label}</div>
      {room.primaryTenant && (
        <div>
          Đại diện: {room.primaryTenant.fullName} · {room.primaryTenant.phone}
        </div>
      )}
      {overdue && <div>⚠ Có hóa đơn quá hạn</div>}
    </>
  );

  return (
    <Tooltip title={tooltip}>
      <Link
        to={`/rooms/${room.id}`}
        aria-label={`Phòng ${room.name}, ${ROOM_STATUS[room.status].label}${overdue ? ', có hóa đơn quá hạn' : ''}`}
        style={{
          position: 'relative',
          display: 'block',
          width: 128,
          minHeight: 72,
          padding: '8px 10px',
          borderRadius: token.borderRadiusLG,
          background,
          // Viền đỏ dày khi có hóa đơn quá hạn, còn lại viền theo màu trạng thái
          border: overdue ? `3px solid ${token.colorError}` : `1px solid ${border}`,
          color: token.colorText,
        }}
      >
        {overdue && (
          <ExclamationCircleFilled style={{ position: 'absolute', top: 6, right: 6, color: token.colorError }} />
        )}
        <div style={{ fontWeight: 600, fontSize: 16 }}>{room.name}</div>
        <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
          {room.primaryTenant?.fullName ?? ROOM_STATUS[room.status].label}
        </Typography.Text>
      </Link>
    </Tooltip>
  );
}

export default function RoomMapPage() {
  const { token } = theme.useToken();

  // Lưu tòa nhà đang chọn trên URL (?buildingId=2) → bấm vào phòng rồi quay lại vẫn giữ lựa chọn
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: buildings = [], isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: buildingsApi.list,
  });

  // Chưa chọn thì mặc định tòa nhà đầu tiên
  const selectedId = Number(searchParams.get('buildingId')) || buildings[0]?.id;

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms', selectedId, undefined], // cùng key với trang Phòng khi lọc theo tòa nhà → dùng chung cache
    queryFn: () => roomsApi.list({ buildingId: selectedId }),
    enabled: !!selectedId,
  });

  const floors = useMemo(() => groupByFloor(rooms), [rooms]);

  // Đếm số phòng theo trạng thái cho chú thích
  const counts = useMemo(() => {
    const result: Record<RoomStatus, number> = { VACANT: 0, OCCUPIED: 0, MAINTENANCE: 0 };
    rooms.forEach((r) => result[r.status]++);
    return result;
  }, [rooms]);
  const overdueCount = rooms.filter((r) => r.hasOverdueInvoice).length;

  const legend = (
    <Space wrap size={[12, 4]}>
      {(Object.keys(ROOM_STATUS) as RoomStatus[]).map((s) => (
        <Badge key={s} color={statusColors(token, s).border} text={`${ROOM_STATUS[s].label}: ${counts[s]}`} />
      ))}
      <Badge color={token.colorError} text={`Quá hạn thanh toán: ${overdueCount}`} />
    </Space>
  );

  let content;
  if (loadingBuildings || (selectedId && loadingRooms)) {
    content = <Spin style={{ display: 'block', margin: '48px auto' }} />;
  } else if (buildings.length === 0) {
    content = (
      <Empty description="Chưa có tòa nhà nào">
        <Link to="/buildings">
          <Button type="primary">Thêm tòa nhà</Button>
        </Link>
      </Empty>
    );
  } else if (rooms.length === 0) {
    content = (
      <Empty description="Tòa nhà này chưa có phòng">
        <Link to="/rooms">
          <Button type="primary">Thêm phòng</Button>
        </Link>
      </Empty>
    );
  } else {
    content = (
      <Flex vertical gap={12}>
        {floors.map(({ floor, rooms: floorRooms }) => (
          <Flex
            key={floor ?? NO_FLOOR}
            gap={12}
            wrap
            align="flex-start"
            style={{ paddingBottom: 12, borderBottom: `1px dashed ${token.colorBorderSecondary}` }}
          >
            <div style={{ width: 96, paddingTop: 8 }}>
              <b>{floorLabel(floor)}</b>
              <br />
              <small style={{ color: token.colorTextSecondary }}>{floorRooms.length} phòng</small>
            </div>
            <Flex gap={8} wrap style={{ flex: 1, minWidth: 0 }}>
              {floorRooms.map((room) => (
                <RoomTile key={room.id} room={room} />
              ))}
            </Flex>
          </Flex>
        ))}
      </Flex>
    );
  }

  return (
    <Card
      title="Sơ đồ phòng"
      extra={
        <Select
          placeholder="Chọn tòa nhà"
          style={{ minWidth: 180 }}
          loading={loadingBuildings}
          value={selectedId}
          onChange={(id: number) => setSearchParams({ buildingId: String(id) }, { replace: true })}
          options={buildings.map((b) => ({ value: b.id, label: b.name }))}
        />
      }
    >
      {rooms.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {legend}
          <div>
            <Tag bordered={false} style={{ marginTop: 8 }}>
              Bấm vào ô để xem chi tiết phòng · rê chuột để xem giá thuê
            </Tag>
          </div>
        </div>
      )}
      {content}
    </Card>
  );
}
