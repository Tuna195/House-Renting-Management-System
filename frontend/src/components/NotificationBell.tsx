import {
  BellOutlined,
  CheckOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Empty, List, Popover, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import type { NotificationItem } from '../types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Tự động thăm dò thông báo mới mỗi 30 giây (polling)
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = data?.unreadCount || 0;
  const items = data?.items || [];

  const handleItemClick = (item: NotificationItem) => {
    if (!item.readAt) {
      markReadMutation.mutate(item.id);
    }
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const content = (
    <div style={{ width: 340, maxWidth: '85vw' }}>
      {/* Header Popover */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 8,
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 4,
        }}
      >
        <Typography.Text strong style={{ fontSize: 15 }}>
          Thông báo {unreadCount > 0 && `(${unreadCount} chưa đọc)`}
        </Typography.Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            loading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
            style={{ padding: 0, fontSize: 12 }}
          >
            Đã đọc tất cả
          </Button>
        )}
      </div>

      {/* Danh sách thông báo */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin size="small" />
        </div>
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Bạn chưa có thông báo nào"
          style={{ margin: '20px 0' }}
        />
      ) : (
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleItemClick(item)}
                style={{
                  cursor: 'pointer',
                  padding: '10px 8px',
                  borderRadius: 8,
                  backgroundColor: item.readAt ? 'transparent' : '#f0fdf4',
                  transition: 'background-color 0.2s',
                  borderBottom: '1px solid #f8fafc',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.readAt ? '#f8fafc' : '#dcfce7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = item.readAt ? 'transparent' : '#f0fdf4';
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {!item.readAt && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: '#16a34a',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography.Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                      {item.title}
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ margin: '2px 0 4px', fontSize: 12, color: '#475569' }}
                  >
                    {item.body}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(item.createdAt).format('HH:mm DD/MM/YYYY')}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Button
        type="text"
        shape="circle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
        }}
        aria-label="Thông báo"
      >
        <Badge count={unreadCount} overflowCount={99} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 18, color: '#475569' }} />
        </Badge>
      </Button>
    </Popover>
  );
}
