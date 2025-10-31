'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface Student {
  id: string
  name: string
  rollNo: string
  paymentStatus: string
  photoStatus: string
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [registering, setRegistering] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check admin auth
    const adminAuth = document.cookie.includes('admin-auth=true')
    if (!adminAuth) {
      router.push('/admin')
      return
    }
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(data.students)
    } catch (err) {
      console.error('Failed to fetch students')
    }
  }

  const registerStudent = async () => {
    setRegistering(true)
    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rollNo })
      })
      if (res.ok) {
        setName('')
        setRollNo('')
        fetchStudents()
      }
    } catch (err) {
      console.error('Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-gray-50 p-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => { document.cookie = 'admin-auth=; path=/; max-age=0'; router.push('/admin') }}>
            Logout
          </Button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <CardHeader>
              <CardTitle>Register New Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="transition-all duration-200 focus:scale-105"
                />
                <Input
                  placeholder="Roll No"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="transition-all duration-200 focus:scale-105"
                />
                <Button onClick={registerStudent} disabled={registering} className="transition-all duration-200 hover:scale-105 active:scale-95">
                  {registering ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
                {students.map((student, index) => (
                  <motion.div
                    key={student.id}
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-300 animate-in fade-in-0 slide-in-from-left-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => router.push(`/admin/student/${student.id}`)}
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">Roll No: {student.rollNo}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                      <span>Payment: <span className={student.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}>{student.paymentStatus}</span></span>
                      <span>Photos: <span className={student.photoStatus === 'Ready' ? 'text-green-600' : 'text-yellow-600'}>{student.photoStatus}</span></span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}