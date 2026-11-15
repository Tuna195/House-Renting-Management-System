import {
  CameraOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { CreateMaintenanceInput } from '../../types';

interface MaintenanceDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateMaintenanceInput) => void;
  isSubmitting: boolean;
  roomName?: string;
  buildingName?: string;
}

const QUICK_TAGS = [
  { label: '💧 Rò rỉ nước', title: 'Hỏng vòi nước / Rò rỉ nước' },
  { label: '⚡ Cháy bóng đèn', title: 'Cháy bóng đèn / Sự cố điện' },
  { label: '🚪 Kẹt ổ khóa', title: 'Kẹt khóa cửa / Hỏng bản lề' },
  { label: '❄️ Hỏng điều hòa', title: 'Điều hòa không mát / Chảy nước' },
  { label: '🚰 Tắc cống thoát', title: 'Tắc bồn rửa / Cống thoát sàn' },
  { label: '📦 Sự cố khác', title: '' },
];

/**
 * Nén ảnh tự động trên trình duyệt client trước khi gửi:
 * - Giảm kích thước ảnh xuống tối đa 1200px
 * - Nén định dạng JPEG 0.8 để dung lượng chỉ còn ~100-250KB
 * - Tương thích mượt mà với camera điện thoại
 */
function compressImage(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo bộ xử lý hình ảnh'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.onerror = () => reject(new Error('Tệp không phải là hình ảnh hợp lệ'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi đọc tệp từ thiết bị'));
    reader.readAsDataURL(file);
  });
}

export function MaintenanceDrawer({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  roomName,
  buildingName,
}: MaintenanceDrawerProps) {
  const [form] = Form.useForm<CreateMaintenanceInput>();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedTag(null);
      setPreviewImage(null);
      setImageSizeKb(null);
      setIsUrlMode(false);
    }
  }, [open, form]);

  const handleSelectQuickTag = (tag: (typeof QUICK_TAGS)[0]) => {
    setSelectedTag(tag.label);
    if (tag.title) {
      form.setFieldsValue({ title: tag.title });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const { dataUrl, sizeKb } = await compressImage(file);
      setPreviewImage(dataUrl);
      setImageSizeKb(sizeKb);
      form.setFieldsValue({ imageUrl: dataUrl });
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
    } finally {
      setIsCompressing(false);
      // Reset input value để có thể chọn lại cùng 1 file nếu muốn
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setImageSizeKb(null);
    form.setFieldsValue({ imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFinish = (values: CreateMaintenanceInput) => {
    onSubmit(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {roomName && (
        <div
          style={{
            marginBottom: 14,
            background: '#eff6ff',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #bfdbfe',
          }}
        >
          <Typography.Text style={{ fontSize: 13, color: '#1e40af' }}>
            🏠 Sự cố áp dụng cho: <strong>Phòng {roomName}</strong>{' '}
            {buildingName ? `• ${buildingName}` : ''}
          </Typography.Text>
        </div>
      )}

      <Alert
        type="info"
        showIcon
        message="Yêu cầu sửa chữa sẽ được gửi tức thì đến chủ nhà."
        description="Vui lòng chụp ảnh rõ vị trí hư hỏng để chủ nhà chuẩn bị linh kiện hoặc hẹn thợ phù hợp."
        style={{ marginBottom: 16 }}
      />

      {/* Gợi ý chọn nhanh */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          Gợi ý chọn nhanh phân loại hư hỏng:
        </Typography.Text>
        <Space wrap size={[8, 8]}>
          {QUICK_TAGS.map((tag) => (
            <Button
              key={tag.label}
              size="small"
              type={selectedTag === tag.label ? 'primary' : 'default'}
              shape="round"
              onClick={() => handleSelectQuickTag(tag)}
            >
              {tag.label}
            </Button>
          ))}
        </Space>
      </div>

      <Form.Item
        name="title"
        label="Tiêu đề sự cố"
        rules={[
          { required: true, message: 'Vui lòng nhập tiêu đề sự cố' },
          { min: 3, message: 'Tiêu đề cần ít nhất 3 ký tự' },
          { max: 100, message: 'Tiêu đề không quá 100 ký tự' },
        ]}
      >
        <Input placeholder="Ví dụ: Vòi nước bồn rửa bát bị rò rỉ" size="large" allowClear />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả chi tiết"
        rules={[{ max: 1000, message: 'Mô tả tối đa 1000 ký tự' }]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Mô tả cụ thể: Bị rò rỉ từ tối qua, khóa van tổng rồi vẫn rỉ... Bạn có thể ghi chú thêm khung giờ tiện ở phòng để thợ qua kiểm tra."
          showCount
          maxLength={1000}
        />
      </Form.Item>

      {/* Input File ẩn hỗ trợ chụp ảnh trực tiếp */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Trường đính kèm ảnh hiện trường */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            Ảnh hiện trường sự cố:
          </Typography.Text>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => setIsUrlMode(!isUrlMode)}
            style={{ padding: 0, fontSize: 12 }}
          >
            {isUrlMode ? 'Đổi sang chụp/chọn ảnh' : 'Hoặc dán link ảnh'}
          </Button>
        </div>

        {isUrlMode ? (
          <Form.Item
            name="imageUrl"
            noStyle
            rules={[
              {
                validator: (_, value) => {
                  if (!value || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Vui lòng nhập link URL hợp lệ (http/https)'));
                },
              },
            ]}
          >
            <Input placeholder="https://example.com/anh-su-co.jpg" allowClear size="large" />
          </Form.Item>
        ) : (
          <div>
            {!previewImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #3b82f6',
                  borderRadius: 12,
                  padding: '20px 14px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <CameraOutlined style={{ fontSize: 30, color: '#3b82f6', marginBottom: 6 }} />
                <div style={{ fontWeight: 600, color: '#1e40af', fontSize: 14 }}>
                  {isCompressing ? 'Đang xử lý ảnh...' : '📷 Chụp ảnh hoặc Chọn từ thiết bị'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Tự động tối ưu dung lượng và tải lên nhanh chóng
                </div>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    height: 180,
                    width: '100%',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={previewImage}
                    alt="Ảnh hiện trường"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                    ✓ Đã đính kèm ảnh ({imageSizeKb} KB)
                  </span>
                  <Space size={8}>
                    <Button
                      size="small"
                      icon={<CameraOutlined />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Đổi ảnh
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                    >
                      Xóa
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Hủy bỏ
        </Button>
        <Button type="primary" htmlType="submit" loading={isSubmitting} size="large">
          Gửi yêu cầu sửa chữa
        </Button>
      </Space>
    </Form>
  );
}
