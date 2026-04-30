import { Info, Database, AlertTriangle, Bot, Server, Shield } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'

interface NoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const noticeItems = [
  {
    icon: Database,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: '数据存储说明',
    items: ['数据保存在浏览器本地', '不会上传至服务器', '请定期导出备份'],
  },
  {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: '数据丢失风险',
    items: ['清除缓存会永久丢失数据', '无痕模式关闭后数据丢失', '跨设备数据不会同步'],
  },
  {
    icon: Bot,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'AI生成内容声明',
    items: ['内容仅供参考，请自行验证', '结果可能存在错误', '勿用于关键决策'],
  },
  {
    icon: Server,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: '服务可用性',
    items: ['按"现状"提供服务', '可能因维护暂时中断', '保留修改服务的权利'],
  },
]

const disclaimer = {
  icon: Shield,
  iconBg: 'bg-red-100',
  iconColor: 'text-red-600',
  title: '免责声明',
  items: [
    '直接或间接损失我们不承担责任',
    '用户自行承担使用风险',
    '用户需确保使用行为符合当地法律法规',
  ],
}

export function NoticeDialog({ open, onOpenChange }: NoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-border bg-surface shadow-lg">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted" />
            <DialogTitle className="text-lg font-semibold text-primary">
              使用须知与免责声明
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* 2x2 网格 */}
          <div className="grid grid-cols-2 gap-4">
            {noticeItems.map((notice) => (
              <div
                key={notice.title}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${notice.iconBg}`}
                  >
                    <notice.icon className={`h-4 w-4 ${notice.iconColor}`} />
                  </div>
                  <h3 className="text-sm font-medium text-primary">
                    {notice.title}
                  </h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted">
                  {notice.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-muted" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 免责声明 - 全宽 */}
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${disclaimer.iconBg}`}
              >
                <disclaimer.icon className={`h-4 w-4 ${disclaimer.iconColor}`} />
              </div>
              <h3 className="text-sm font-medium text-primary">
                {disclaimer.title}
              </h3>
            </div>
            <ul className="space-y-1.5 text-sm text-muted">
              {disclaimer.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 底部提示 */}
          <p className="text-center text-xs text-muted">
            继续使用本服务即表示您已阅读并同意以上条款
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
