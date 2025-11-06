'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { useCallback, useRef, useState } from 'react'

interface ResizableMediaProps {
  node: {
    attrs: {
      src?: string
      width?: number
      height?: number
    }
  }
  updateAttributes: (attrs: any) => void
  mediaType: 'image' | 'video'
}

export const ResizableMedia = ({ node, updateAttributes, mediaType }: ResizableMediaProps) => {
  const [isResizing, setIsResizing] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
      e.preventDefault()
      setIsResizing(true)

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      }

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startPos.current.x
        const deltaY = e.clientY - startPos.current.y

        let newWidth = startPos.current.width
        let newHeight = startPos.current.height

        // Calculate new dimensions based on direction
        if (direction === 'se') {
          newWidth = startPos.current.width + deltaX
          newHeight = newWidth / aspectRatio
        } else if (direction === 'sw') {
          newWidth = startPos.current.width - deltaX
          newHeight = newWidth / aspectRatio
        } else if (direction === 'ne') {
          newWidth = startPos.current.width + deltaX
          newHeight = newWidth / aspectRatio
        } else if (direction === 'nw') {
          newWidth = startPos.current.width - deltaX
          newHeight = newWidth / aspectRatio
        }

        // Apply constraints
        newWidth = Math.max(100, Math.min(newWidth, 800))
        newHeight = newWidth / aspectRatio

        updateAttributes({
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        })
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [aspectRatio, updateAttributes]
  )

  const handleMediaLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    const media = e.currentTarget
    if (media instanceof HTMLImageElement) {
      setAspectRatio(media.naturalWidth / media.naturalHeight)
    } else if (media instanceof HTMLVideoElement) {
      setAspectRatio(media.videoWidth / media.videoHeight)
    }
  }, [])

  const width = node.attrs.width || 400
  const height = node.attrs.height || width / aspectRatio

  return (
    <NodeViewWrapper className="relative inline-block group">
      <div
        ref={containerRef}
        className={`relative ${isResizing ? 'select-none' : ''}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {mediaType === 'image' ? (
          <img
            src={node.attrs.src}
            alt=""
            className="w-full h-full object-contain"
            onLoad={handleMediaLoad}
          />
        ) : (
          <video
            src={node.attrs.src}
            controls
            className="w-full h-full object-contain"
            onLoadedMetadata={handleMediaLoad}
          />
        )}

        {/* Resize Handles */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {/* Southeast handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
          
          {/* Southwest handle */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 bg-blue-500 cursor-sw-resize pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          
          {/* Northeast handle */}
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-blue-500 cursor-ne-resize pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          
          {/* Northwest handle */}
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-blue-500 cursor-nw-resize pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
