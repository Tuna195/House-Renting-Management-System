import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Grid,
  Image,
  List,
  Modal,
  Segmented,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { getErrorMessage } from '../../api/client';
import { portalApi } from '../../api/portal';
import type { CreateMaintenanceInput, MaintenanceRequest, MaintenanceStatus } from '../../types';
import { maintenanceStatusMap } from '../../utils/status';
import { MaintenanceDrawer } from './MaintenanceDrawer';

const QUERY_KEY = ['portal', 'maintenance'];

export default function MaintenancePage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: portalApi.listMaintenance,
  });

  // Kiểm tra hợp đồng đang hiệu lực của khách thuê
  const { data: contract, isLoading: isContractLoading } = useQuery({
    queryKey: ['portal', 'contract', 'active'],
    queryFn: portalApi.getActiveContract,
  });

  const hasActiveContract = Boolean(contract);

  const createMutation = useMutation({
    mutationFn: portalApi.createMaintenance,
    onSuccess: () => {
      message.success('Đã gửi yêu cầu sửa chữa đến chủ nhà!');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });

  // Tính số lượng theo từng trạng thái để hiện trên thanh lọc
  const stats = useMemo(() => {
    return {
      all: data.length,
      open: data.filter((item) => item.status === 'OPEN').length,
      inProgress: data.filter((item) => item.status === 'IN_PROGRESS').length,
      done: data.filter((item) => item.status === 'DONE').length,
      rejected: data.filter((item) => item.status === 'REJECTED').length,
    };
  }, [data]);

  // Danh sách sau khi lọc
  const filteredData = useMemo(() => {
    if (filterStatus === 'ALL') return data;
    return data.filter((item) => item.status === filterStatus);
  }, [data, filterStatus]);

  const isMobile = !screens.md;

  const renderStatusTag = (status: MaintenanceStatus) => {
    const config = maintenanceStatusMap[status] || {
      label: status,
      color: 'default',
      badgeStatus: 'default',
    };

    let icon = <ClockCircleOutlined />;
    if (status === 'IN_PROGRESS') icon = <SyncOutlined spin />;
    if (status === 'DONE') icon = <CheckCircleOutlined />;
    if (status === 'REJECTED') icon = <CloseCircleOutlined />;

    return (
      <Tag color={config.color} icon={icon} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6 }}>
        {config.label}
      </Tag>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header Banner */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#ffffff',
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.2)',
        }}
        styles={{ body: { padding: isMobile ? '16px' : '24px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Typography.Title level={isMobile ? 4 : 3} style={{ color: '#ffffff', margin: 0 }}>
              🛠️ Yêu Cầu Sửa Chữa
            </Typography.Title>
            <Typography.Text style={{ color: '#dbeafe', fontSize: isMobile ? 12 : 14 }}>
              Báo hỏng hóc thiết bị, điện nước trong phòng để chủ nhà hỗ trợ xử lý
            </Typography.Text>
            {contract && (
              <div style={{ marginTop: 6 }}>
                <Tag
                  icon={<HomeOutlined />}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  Phòng {contract.room.name} • {contract.room.building.name}
                </Tag>
              </div>
            )}
          </div>

          <Tooltip title={!hasActiveContract && !isContractLoading ? 'Cần có hợp đồng thuê phòng hiệu lực để báo sự cố' : undefined}>
            <span>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                disabled={!hasActiveContract && !isContractLoading}
                onClick={() => setIsModalOpen(true)}
                style={{
                  backgroundColor: !hasActiveContract && !isContractLoading ? undefined : '#ffffff',
                  color: !hasActiveContract && !isContractLoading ? undefined : '#1e3a8a',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: 'none',
                  borderRadius: 8,
                }}
              >
                Báo sự cố mới
              </Button>
            </span>
          </Tooltip>
        </div>
      </Card>

      {/* Alert cảnh báo thông minh nếu chưa có hợp đồng */}
      {!hasActiveContract && !isContractLoading && (
        <Alert
          type="warning"
          showIcon
          message="Bạn chưa có hợp đồng thuê phòng đang hiệu lực"
          description="Tài khoản của bạn hiện chưa được xếp vào căn phòng nào hoặc hợp đồng thuê trước đó đã kết thúc. Vui lòng liên hệ với chủ nhà để được lập hợp đồng trước khi tạo yêu cầu sửa chữa."
          style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #fde047' }}
        />
      )}

      {/* Filter Segmented */}
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
            { label: `Xong (${stats.done})`, value: 'DONE' },
            ...(stats.rejected > 0 ? [{ label: `Từ chối (${stats.rejected})`, value: 'REJECTED' }] : []),
          ]}
        />
      </div>

      {/* Action bar: Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Hiển thị {filteredData.length} yêu cầu
        </Typography.Text>
        <Button
          type="text"
          icon={<ReloadOutlined spin={isRefetching} />}
          onClick={() => refetch()}
          size="small"
        >
          Làm mới
        </Button>
      </div>

      {/* Content List */}
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
                ? 'Phòng bạn chưa có yêu cầu sửa chữa nào.'
                : 'Không có yêu cầu nào trong trạng thái này.'
            }
          >
            {filterStatus === 'ALL' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Gửi yêu cầu đầu tiên
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <List
          dataSource={filteredData}
          split={false}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{
                marginBottom: 12,
                borderRadius: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: item.status === 'OPEN' ? '1.5px solid #fde047' : '1px solid #e2e8f0',
                transition: 'all 0.2s',
              }}
              styles={{ body: { padding: isMobile ? '14px' : '18px' } }}
            >
              {/* Header card: Room info + Status Tag */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <div>
                  <Typography.Text strong style={{ fontSize: isMobile ? 15 : 16, color: '#0f172a' }}>
                    {item.title}
                  </Typography.Text>
                  <div style={{ marginTop: 2 }}>
                    <Tag icon={<HomeOutlined />} color="default" style={{ fontSize: 11, borderRadius: 4 }}>
                      Phòng {item.room?.name || 'P101'} • {item.room?.building?.name || 'Nhà trọ'}
                    </Tag>
                  </div>
                </div>

                <div>{renderStatusTag(item.status)}</div>
              </div>

              {/* Description */}
              {item.description ? (
                <Typography.Paragraph
                  style={{
                    color: '#475569',
                    fontSize: 13,
                    marginBottom: 10,
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                  }}
                >
                  {item.description}
                </Typography.Paragraph>
              ) : null}

              {/* Image preview trực tiếp nếu có */}
              {item.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <Image
                    src={item.imageUrl}
                    alt="Ảnh hiện trường sự cố"
                    height={100}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              )}

              {/* Footer info: dates */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  color: '#94a3b8',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 8,
                  marginTop: 8,
                }}
              >
                <span>Gửi lúc: {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</span>

                {item.resolvedAt && (
                  <span style={{ color: '#16a34a', fontWeight: 500 }}>
                    Xong lúc: {dayjs(item.resolvedAt).format('DD/MM/YYYY HH:mm')}
                  </span>
                )}
              </div>
            </Card>
          )}
        />
      )}

      {/* Form Drawer (Mobile bottom drawer / Desktop modal) */}
      {isMobile ? (
        <Drawer
          title="⚠️ Gửi Yêu Cầu Báo Sự Cố"
          placement="bottom"
          height="85%"
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          styles={{ body: { paddingBottom: 24 } }}
        >
          <MaintenanceDrawer
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={(values) => createMutation.mutate(values)}
            isSubmitting={createMutation.isPending}
            roomName={contract?.room.name}
            buildingName={contract?.room.building.name}
          />
        </Drawer>
      ) : (
        <Modal
          title="⚠️ Gửi Yêu Cầu Báo Sự Cố Mới"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={560}
          destroyOnClose
        >
          <MaintenanceDrawer
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={(values) => createMutation.mutate(values)}
            isSubmitting={createMutation.isPending}
            roomName={contract?.room.name}
            buildingName={contract?.room.building.name}
          />
        </Modal>
      )}
    </div>
  );
}
