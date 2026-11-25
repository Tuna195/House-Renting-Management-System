import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SyncOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Empty,
  Grid,
  Image,
  List,
  Popconfirm,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { getErrorMessage } from '../../api/client';
import { maintenanceApi } from '../../api/maintenance';
import type { MaintenanceRequest, MaintenanceStatus } from '../../types';
import { maintenanceStatusMap } from '../../utils/status';

export default function MaintenancePage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Lấy toàn bộ danh sách sự cố thuộc các tòa nhà của chủ nhà
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['landlord-maintenance'],
    queryFn: () => maintenanceApi.list({ status: 'ALL' }),
  });

  // Mutation cập nhật trạng thái sự cố
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'IN_PROGRESS' | 'DONE' | 'REJECTED' }) =>
      maintenanceApi.updateStatus(id, status),
    onSuccess: (updated) => {
      message.success(`Đã cập nhật trạng thái sự cố "${updated.title}" thành công!`);
      queryClient.invalidateQueries({ queryKey: ['landlord-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      message.error(getErrorMessage(err));
    },
  });

  // Thống kê số lượng theo từng trạng thái
  const stats = useMemo(() => {
    return {
      all: data.length,
      open: data.filter((item) => item.status === 'OPEN').length,
      inProgress: data.filter((item) => item.status === 'IN_PROGRESS').length,
      done: data.filter((item) => item.status === 'DONE').length,
      rejected: data.filter((item) => item.status === 'REJECTED').length,
    };
  }, [data]);

  // Danh sách đã lọc theo trạng thái chọn
  const filteredData = useMemo(() => {
    if (filterStatus === 'ALL') return data;
    return data.filter((item) => item.status === filterStatus);
  }, [data, filterStatus]);

  const renderStatusTag = (status: MaintenanceStatus) => {
    const config = maintenanceStatusMap[status];
    let icon = <ClockCircleOutlined />;
    if (status === 'IN_PROGRESS') icon = <SyncOutlined spin />;
    if (status === 'DONE') icon = <CheckCircleOutlined />;
    if (status === 'REJECTED') icon = <CloseCircleOutlined />;

    return (
      <Tag color={config.badgeStatus === 'processing' ? 'processing' : config.badgeStatus} icon={icon} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
        {config.label}
      </Tag>
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: '#0f172a' }}>
            <ToolOutlined style={{ marginRight: 8, color: '#2563eb' }} />
            Xử lý Sự cố & Báo sửa chữa
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Tiếp nhận và cập nhật tiến độ xử lý yêu cầu sửa chữa từ khách thuê
          </Typography.Text>
        </div>

        <Button
          icon={<ReloadOutlined spin={isFetching} />}
          onClick={() => refetch()}
          loading={isFetching}
        >
          Làm mới
        </Button>
      </div>

      {/* Thanh lọc trạng thái Segmented */}
      <div style={{ marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <Segmented
          value={filterStatus}
          onChange={(val) => setFilterStatus(val as string)}
          size={isMobile ? 'middle' : 'large'}
          block={isMobile}
          options={[
            { label: `Tất cả (${stats.all})`, value: 'ALL' },
            { label: `Chờ duyệt (${stats.open})`, value: 'OPEN' },
            { label: `Đang xử lý (${stats.inProgress})`, value: 'IN_PROGRESS' },
            { label: `Đã xong (${stats.done})`, value: 'DONE' },
            ...(stats.rejected > 0 ? [{ label: `Từ chối (${stats.rejected})`, value: 'REJECTED' }] : []),
          ]}
        />
      </div>

      {/* Nội dung danh sách */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang tải danh sách sự cố..." />
        </div>
      ) : filteredData.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filterStatus === 'ALL'
                ? 'Hiện tại chưa có sự cố nào được báo cáo'
                : `Không có sự cố nào ở trạng thái "${maintenanceStatusMap[filterStatus as MaintenanceStatus]?.label || filterStatus}"`
            }
          />
        </Card>
      ) : (
        <List
          dataSource={filteredData}
          split={false}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{
                marginBottom: 14,
                borderRadius: 14,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: item.status === 'OPEN' ? '1.5px solid #fde047' : '1px solid #e2e8f0',
              }}
              styles={{ body: { padding: isMobile ? 14 : 20 } }}
            >
              {/* Hàng 1: Tiêu đề + Trạng thái */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <Typography.Text strong style={{ fontSize: isMobile ? 16 : 17, color: '#0f172a' }}>
                    {item.title}
                  </Typography.Text>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Tag icon={<HomeOutlined />} color="blue" style={{ borderRadius: 4, fontSize: 12 }}>
                      Phòng {item.room?.name} • {item.room?.building?.name}
                    </Tag>
                    {item.createdBy && (
                      <Tag icon={<UserOutlined />} color="default" style={{ borderRadius: 4, fontSize: 12 }}>
                        Người báo: <strong>{item.createdBy.fullName}</strong>
                        {item.createdBy.phone && (
                          <a
                            href={`tel:${item.createdBy.phone}`}
                            style={{ marginLeft: 6, color: '#0284c7' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PhoneOutlined /> {item.createdBy.phone}
                          </a>
                        )}
                      </Tag>
                    )}
                  </div>
                </div>

                <div>{renderStatusTag(item.status)}</div>
              </div>

              {/* Mô tả sự cố */}
              {item.description && (
                <Typography.Paragraph
                  style={{
                    color: '#475569',
                    fontSize: 13,
                    margin: '10px 0',
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                  }}
                >
                  {item.description}
                </Typography.Paragraph>
              )}

              {/* Ảnh hiện trường đính kèm */}
              {item.imageUrl && (
                <div style={{ margin: '12px 0' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    📷 Ảnh hiện trường từ khách thuê:
                  </Typography.Text>
                  <Image
                    src={item.imageUrl}
                    alt="Ảnh hiện trường"
                    height={110}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              )}

              {/* Footer: Thời gian & Nút hành động */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  <span>Gửi lúc: {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}</span>
                  {item.resolvedAt && (
                    <span style={{ marginLeft: 12, color: '#16a34a', fontWeight: 500 }}>
                      ✓ Sửa xong: {dayjs(item.resolvedAt).format('HH:mm DD/MM/YYYY')}
                    </span>
                  )}
                </div>

                {/* Các nút bấm chuyển trạng thái */}
                <Space size={8} wrap>
                  {item.status === 'OPEN' && (
                    <>
                      <Popconfirm
                        title="Từ chối yêu cầu sự cố này?"
                        description="Khách thuê sẽ nhận được thông báo từ chối."
                        okText="Từ chối"
                        cancelText="Quay lại"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => updateStatusMutation.mutate({ id: item.id, status: 'REJECTED' })}
                      >
                        <Button danger size="small" loading={updateStatusMutation.isPending}>
                          Từ chối
                        </Button>
                      </Popconfirm>

                      <Button
                        type="primary"
                        size="small"
                        icon={<SyncOutlined />}
                        loading={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'IN_PROGRESS' })}
                      >
                        Tiếp nhận xử lý
                      </Button>
                    </>
                  )}

                  {item.status === 'IN_PROGRESS' && (
                    <>
                      <Popconfirm
                        title="Hủy hoặc từ chối sự cố này?"
                        onConfirm={() => updateStatusMutation.mutate({ id: item.id, status: 'REJECTED' })}
                        okText="Đồng ý"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger size="small" loading={updateStatusMutation.isPending}>
                          Từ chối / Hủy
                        </Button>
                      </Popconfirm>

                      <Popconfirm
                        title="Xác nhận đã xử lý sửa xong?"
                        description="Hệ thống sẽ lưu thời gian hoàn tất và gửi thông báo chúc mừng cho khách."
                        okText="Xác nhận xong"
                        cancelText="Hủy"
                        onConfirm={() => updateStatusMutation.mutate({ id: item.id, status: 'DONE' })}
                      >
                        <Button
                          type="primary"
                          size="small"
                          style={{ backgroundColor: '#16a34a' }}
                          icon={<CheckCircleOutlined />}
                          loading={updateStatusMutation.isPending}
                        >
                          Xác nhận đã sửa xong
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </Space>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
}
