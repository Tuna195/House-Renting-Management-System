import { Result, Typography } from 'antd';
import type { NavItem } from '../navigation';

const weekFile = (week: number) => `docs/ke-hoach/tuan-${String(week).padStart(2, '0')}.md`;

// Màn hình tạm cho trang chưa làm — nói rõ ai làm, tuần nào, đọc hướng dẫn ở đâu
export default function ComingSoonPage({ item }: { item: NavItem }) {
  return (
    <Result
      status="info"
      title={`${item.label} — đang phát triển`}
      subTitle={
        <>
          Phụ trách: <b>{item.owner}</b> · Tuần {item.week}
          <br />
          Hướng dẫn: <Typography.Text code>{item.week ? weekFile(item.week) : 'docs/'}</Typography.Text>
        </>
      }
    />
  );
}
