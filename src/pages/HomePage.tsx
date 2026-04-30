import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Paperclip, Plus, Send, Link, X, MoveRight, FileText, Image, Globe } from 'lucide-react'
import { Button, Loading } from '@/components/ui'
import { AppSidebar, AppHeader, CreateProjectDialog } from '@/components/layout'
import { ENGINES, QUICK_ACTIONS } from '@/constants'
import { formatDate } from '@/lib/utils'
import type { EngineType, Project, UrlAttachment, Attachment, ImageAttachment, DocumentAttachment } from '@/types'
import { ProjectRepository } from '@/services/projectRepository'
import { useChatStore } from '@/stores/chatStore'
import { aiService } from '@/services/aiService'
import { useToast } from '@/hooks/useToast'
import {
  fileToBase64,
  parseDocument,
  validateImageFile,
  validateDocumentFile,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_EXTENSIONS,
} from '@/lib/fileUtils'

export function HomePage() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('mermaid')
  const [isLoading, setIsLoading] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [urlAttachments, setUrlAttachments] = useState<UrlAttachment[]>([])
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')
  const [isParsingUrl, setIsParsingUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const setInitialPrompt = useChatStore((state) => state.setInitialPrompt)
  const { error: showError } = useToast()

  // 新建项目弹窗状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadRecentProjects()
  }, [])

  const loadRecentProjects = async () => {
    try {
      const projects = await ProjectRepository.getAll()
      setRecentProjects(projects.slice(0, 5))
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleQuickStart = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      const project = await ProjectRepository.create({
        title: `Untitled-${Date.now()}`,
        engineType: selectedEngine,
      })

      // 转换文件附件为 Attachment 类型
      const convertedAttachments: Attachment[] = []

      for (const file of attachments) {
        if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
          const dataUrl = await fileToBase64(file)
          const imageAtt: ImageAttachment = {
            type: 'image',
            dataUrl,
            fileName: file.name,
          }
          convertedAttachments.push(imageAtt)
        } else {
          const content = await parseDocument(file)
          const docAtt: DocumentAttachment = {
            type: 'document',
            content,
            fileName: file.name,
          }
          convertedAttachments.push(docAtt)
        }
      }

      // 添加 URL 附件
      convertedAttachments.push(...urlAttachments)

      // 传递 prompt 和附件
      const allAttachments = convertedAttachments.length > 0 ? convertedAttachments : null
      setInitialPrompt(prompt.trim(), allAttachments)
      navigate(`/editor/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickStart()
    }
  }

  // 处理剪贴板粘贴
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const filesToProcess: File[] = []

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          filesToProcess.push(file)
        }
      }
    }

    if (filesToProcess.length === 0) return

    e.preventDefault()

    for (const file of filesToProcess) {
      // 处理图片
      if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
          showError(validation.error!)
          continue
        }
        // 为粘贴的图片生成文件名
        const fileName = file.name || `pasted-image-${Date.now()}.png`
        const newFile = new File([file], fileName, { type: file.type })
        setAttachments(prev => [...prev, newFile])
      }
      // 处理文档
      else if (SUPPORTED_DOCUMENT_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext.replace('*', '')))) {
        const validation = validateDocumentFile(file)
        if (!validation.valid) {
          showError(validation.error!)
          continue
        }
        setAttachments(prev => [...prev, file])
      }
    }
  }

  const handleQuickAction = async (action: (typeof QUICK_ACTIONS)[0]) => {
    setSelectedEngine(action.engine)
    setPrompt(action.prompt)
    // 自动聚焦到输入框
    textareaRef.current?.focus()
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const removeUrlAttachment = (index: number) => {
    setUrlAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleUrlSubmit = async () => {
    const url = urlInputValue.trim()
    if (!url) return

    setIsParsingUrl(true)
    try {
      const result = await aiService.parseUrl(url)
      if (result.data) {
        const urlAttachment: UrlAttachment = {
          type: 'url',
          content: result.data.content,
          url: result.data.url,
          title: result.data.title,
        }
        setUrlAttachments(prev => [...prev, urlAttachment])
        setUrlInputValue('')
        setShowUrlInput(false)
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : '链接解析失败')
      console.error(err)
    } finally {
      setIsParsingUrl(false)
    }
  }

  const engineColors: Record<EngineType, { dot: string; border: string; bg: string }> = {
    mermaid: { dot: 'bg-gray-900', border: 'border-gray-300', bg: 'hover:bg-gray-50' },
    excalidraw: { dot: 'bg-orange-400', border: 'border-orange-200', bg: 'hover:bg-orange-50' },
    drawio: { dot: 'bg-green-500', border: 'border-green-200', bg: 'hover:bg-green-50' },
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Floating Sidebar Navigation */}
      <AppSidebar onCreateProject={() => setIsCreateDialogOpen(true)} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <AppHeader />

        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center px-8 pt-8">
          {/* Main Title */}
          <div className="mb-6 flex flex-col items-center">
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-primary">
              用自然语言绘制专业图表
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                上传文档，可视化阅读
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Image className="h-4 w-4" />
                上传图片复刻图表
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                链接解析，快速解读网页
              </span>
            </div>
          </div>

          {/* Chat Input Box */}
          <div className="mb-6 w-full max-w-3xl">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow focus-within:shadow-md">
              {/* 附件预览区域 */}
              {(attachments.length > 0 || urlAttachments.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={`file-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-sm"
                    >
                      <Paperclip className="h-3 w-3 text-muted" />
                      <span className="max-w-[150px] truncate text-primary">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-muted hover:text-primary"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {urlAttachments.map((urlAtt, index) => (
                    <div
                      key={`url-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-sm"
                    >
                      <Link className="h-3 w-3 text-muted" />
                      <span className="max-w-[150px] truncate text-primary">
                        {urlAtt.title}
                      </span>
                      <button
                        onClick={() => removeUrlAttachment(index)}
                        className="text-muted hover:text-primary"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                placeholder="描述要表达的流程、关系或结构，也可以粘贴图片或补充上下文"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isLoading}
                className="min-h-[80px] w-full resize-none bg-transparent text-primary placeholder:text-muted focus:outline-none"
                rows={3}
              />

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              {/* 底部工具栏 */}
              <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
                <div className="flex items-center gap-3">
                  {/* 引擎选择 - 平铺按钮 */}
                  <div className="flex items-center gap-2">
                    {ENGINES.map((engine) => {
                      const colors = engineColors[engine.value]
                      const isSelected = selectedEngine === engine.value
                      return (
                        <button
                          key={engine.value}
                          onClick={() => setSelectedEngine(engine.value)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                            isSelected
                              ? `${colors.border} ${colors.bg} font-medium text-primary`
                              : 'border-border text-muted hover:text-primary'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                          <span>{engine.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 上传附件 */}
                  <button
                    onClick={handleAttachmentClick}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-primary"
                    title="可上传文档一键转化为图表，或上传截图复刻图表"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>上传附件</span>
                  </button>

                  {/* 添加链接 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      disabled={isParsingUrl}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
                      title="添加网页链接，AI将解析内容"
                    >
                      <Link className="h-4 w-4" />
                      <span>添加链接</span>
                    </button>

                    {/* 链接输入弹出框 */}
                    {showUrlInput && (
                      <div className="absolute bottom-full right-0 mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface p-2 shadow-lg">
                        <input
                          type="url"
                          placeholder="输入网址链接..."
                          value={urlInputValue}
                          onChange={(e) => setUrlInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleUrlSubmit()
                            } else if (e.key === 'Escape') {
                              setShowUrlInput(false)
                              setUrlInputValue('')
                            }
                          }}
                          disabled={isParsingUrl}
                          className="w-64 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleUrlSubmit}
                          disabled={!urlInputValue.trim() || isParsingUrl}
                          className="h-7 px-2"
                        >
                          {isParsingUrl ? <Loading size="sm" /> : <MoveRight className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowUrlInput(false)
                            setUrlInputValue('')
                          }}
                          disabled={isParsingUrl}
                          className="h-7 px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 发送按钮 */}
                  <Button
                    onClick={handleQuickStart}
                    disabled={!prompt.trim() || isLoading}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-surface transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>创建中...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>发送</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 快捷键提示 */}
            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-xs text-muted">
                回车立即创建，Shift + Enter 换行。
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12 w-full max-w-3xl">
            <p className="mb-4 text-left text-sm text-muted">试试这些用例，快速开始</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {QUICK_ACTIONS.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-background">
                    <action.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-primary line-clamp-2">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Projects Section */}
          <div className="w-full max-w-6xl pb-12">
            <h2 className="mb-4 text-lg font-medium text-primary">最近项目</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {/* New Project Card */}
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-all hover:border-primary hover:shadow-md"
                style={{ height: 'calc(6rem + 68px)' }}
              >
                <Plus className="mb-2 h-6 w-6 text-muted" />
                <span className="text-sm text-muted">新建项目</span>
              </button>

              {/* Recent Projects */}
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/editor/${project.id}`)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex h-24 items-center justify-center bg-background">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Sparkles className="h-8 w-8 text-muted" />
                    )}
                  </div>
                  <div className="p-3 text-left">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-primary">
                        {project.title === `Untitled-${project.id}`
                          ? '未命名'
                          : project.title}
                      </p>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        project.engineType === 'excalidraw'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : project.engineType === 'drawio'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      }`}>
                        {project.engineType.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      更新于 {formatDate(project.updatedAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
