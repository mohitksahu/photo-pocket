'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => { document.cookie = 'admin-auth=; path=/; max-age=0'; router.push('/admin') }}>
            Logout
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Register New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Roll No"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
              />
              <Button onClick={registerStudent} disabled={registering}>
                {registering ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex justify-between items-center p-4 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/student/${student.id}`)}
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">Roll No: {student.rollNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Payment: {student.paymentStatus}</p>
                    <p className="text-sm">Photos: {student.photoStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}