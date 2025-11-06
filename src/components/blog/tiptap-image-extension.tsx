import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableMedia } from './resizable-media'

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          return {
            width: attributes.width,
          }
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          return {
            height: attributes.height,
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <ResizableMedia {...props} mediaType="image" />
    ))
  },
})
