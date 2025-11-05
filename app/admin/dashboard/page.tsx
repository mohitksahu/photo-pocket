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
  phoneNumber: string
  paymentStatus: string
  photoStatus: string
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [studentsError, setStudentsError] = useState('')
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [registering, setRegistering] = useState(false)
  const [phoneNumberError, setPhoneNumberError] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')
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
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const res = await fetch('/api/students')
      if (!res.ok) {
        setStudentsError('Failed to fetch students');
        setStudents([]);
        return;
      }
      const data = await res.json();
      setStudents(data.students);
    } catch (err) {
      setStudentsError('Failed to fetch students');
      setStudents([]);
      console.error('Failed to fetch students', err);
    } finally {
      setStudentsLoading(false);
    }
  }

  // Validate that we have exactly 10 digits
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '').replace(/^91/, '')
    if (digits.length !== 10) {
      setPhoneNumberError('Phone number must be 10 digits')
      return false
    }
    setPhoneNumberError('')
    return true
  }

  // Normalize to E.164-like: +91XXXXXXXXXX (no spaces) for storage/lookup
  const normalizePhoneNumber = (input: string): string => {
    const digits = input.replace(/\D/g, '')
    const last10 = digits.slice(-10)
    if (last10.length === 10) return `+91${last10}`
    return input.trim()
  }

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value)
    if (value) {
      validatePhoneNumber(value)
    } else {
      setPhoneNumberError('')
    }
    // Clear check message when changing
    setCheckMessage('')
  }

  const checkPhoneNumber = async () => {
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return
    }
    setChecking(true)
    setCheckMessage('')
    try {
      const normalized = normalizePhoneNumber(phoneNumber)
      const res = await fetch('/api/student/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalized })
      })
      if (res.ok) {
        const data = await res.json()
        setCheckMessage(data.message)
      } else {
        setCheckMessage('Error checking phone number')
      }
    } catch (err) {
      setCheckMessage('Error checking phone number')
    } finally {
      setChecking(false)
    }
  }

  const registerStudent = async () => {
    if (!name.trim()) {
      alert('Please enter a name')
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return
    }

    setRegistering(true)
    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phoneNumber: normalizePhoneNumber(phoneNumber) })
      })
      if (res.ok) {
        setName('')
        setPhoneNumber('')
        setPhoneNumberError('')
        fetchStudents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to register student')
      }
    } catch (err) {
      console.error('Failed to register')
      alert('Failed to register student')
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
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  className={`transition-all duration-200 focus:scale-105 ${phoneNumberError ? 'border-red-500' : ''}`}
                />
                {phoneNumberError && (
                  <p className="text-red-500 text-sm mt-1">{phoneNumberError}</p>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={checkPhoneNumber} disabled={checking || !phoneNumber || !!phoneNumberError} variant="outline" className="transition-all duration-200 hover:scale-105 active:scale-95">
                      {checking ? 'Checking...' : 'Check'}
                    </Button>
                    <Button onClick={registerStudent} disabled={registering} className="transition-all duration-200 hover:scale-105 active:scale-95">
                      {registering ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                  {checkMessage && (
                    <p className={`text-sm mt-1 ${checkMessage.includes('already') ? 'text-red-500' : 'text-green-500'}`}>{checkMessage}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8 text-gray-400">Loading students...</div>
              ) : studentsError ? (
                <div className="text-center py-8 text-red-500">{studentsError}</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No students registered yet.</div>
              ) : (
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
                        <p className="text-sm text-gray-600">Phone: {student.phoneNumber}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                        <span>Payment: <span className={student.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'}>{student.paymentStatus}</span></span>
                        <span>Photos: <span className={student.photoStatus === 'Ready' ? 'text-green-600' : 'text-yellow-600'}>{student.photoStatus}</span></span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}