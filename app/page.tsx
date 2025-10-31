'use client'

import StudentLoginForm from '@/components/student/student-login-form'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <StudentLoginForm />
    </motion.div>
  )
}
