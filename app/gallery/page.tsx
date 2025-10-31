'use client'

import PhotoGallery from '@/components/student/photo-gallery'
import { motion } from 'framer-motion'

export default function GalleryPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PhotoGallery />
    </motion.div>
  )
}