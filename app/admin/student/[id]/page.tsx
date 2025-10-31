'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import QRCode from 'qrcode'
import { Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR, { mutate } from 'swr'

interface Student {
  id: string
  name: string
  rollNo: string
  paymentStatus: string
  photoStatus: string
}

interface Photo {
  id: string
  name: string
  url: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function StudentPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [paymentQR, setPaymentQR] = useState('')
  const [loginQR, setLoginQR] = useState('')
  const [password, setPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [generatingPaymentQR, setGeneratingPaymentQR] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: photosData, error: photosError, isLoading: photosLoading } = useSWR(
    student ? `/api/admin/gallery/${student.rollNo}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  useEffect(() => {
    // Check admin auth
    const adminAuth = document.cookie.includes('admin-auth=true')
    if (!adminAuth) {
      router.push('/admin')
      return
    }

    // Fetch student data
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/student/${id}`)
        if (res.ok) {
          const data = await res.json()
          setStudent(data.student)
        } else {
          console.error('Failed to fetch student')
        }
      } catch (err) {
        console.error('Error fetching student:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [id, router])

  const generatePaymentQR = async () => {
    if (!student) return
    setGeneratingPaymentQR(true)
    const upiLink = `upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'your_upi_id@bank'}&pn=Fest%20Photos&tr=${student.rollNo}&am=50.00`
    try {
      const qr = await QRCode.toDataURL(upiLink)
      setPaymentQR(qr)
    } catch (err) {
      console.error('Failed to generate QR')
    } finally {
      setGeneratingPaymentQR(false)
    }
  }

  const markAsPaid = async () => {
    if (!student) return
    setMarkingPaid(true)
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: student.rollNo })
      })
      if (res.ok) {
        const data = await res.json()
        setPassword(data.password)
        const loginText = `Fest Photo Portal: ${window.location.origin}\nUsername: ${student.rollNo}\nPassword: ${data.password}`
        const qr = await QRCode.toDataURL(loginText)
        setLoginQR(qr)
        // Student data doesn't change, no need to refetch
      }
    } catch (err) {
      console.error('Failed to mark as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !student) return

    setUploading(true)
    try {
      // Get auth params
      const authRes = await fetch('/api/imagekit-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: student.rollNo })
      })
      const auth = await authRes.json()

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', file.name)
        formData.append('folder', auth.folder)
        formData.append('signature', auth.signature)
        formData.append('expire', auth.expire.toString())
        formData.append('token', auth.token)
        formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!)
        formData.append('useUniqueFileName', 'false')

        await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData
        })
      }
      alert('Photos uploaded successfully')
      mutate(`/api/admin/gallery/${student.rollNo}`)
    } catch (err) {
      console.error('Upload failed')
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      const res = await fetch(`/api/image/${imageId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        mutate(`/api/admin/gallery/${student!.rollNo}`)
      } else {
        alert('Failed to delete photo')
      }
    } catch (err) {
      console.error('Delete failed')
      alert('Delete failed')
    }
  }

  const updatePhotoStatus = async (status: string) => {
    if (!student) return
    try {
      await fetch('/api/student/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNo: student.rollNo, status })
      })
      // No need to refetch student, status is local
    } catch (err) {
      console.error('Failed to update status')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center animate-in fade-in-0 duration-300">Loading...</div>
  }

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center animate-in fade-in-0 duration-300">Student not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold animate-in slide-in-from-left-4 duration-500">{student.name} - {student.rollNo}</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="transition-all duration-200 hover:scale-105 active:scale-95">
              Back to Dashboard
            </Button>
            <Button onClick={() => { document.cookie = 'admin-auth=; path=/; max-age=0'; router.push('/admin') }} className="transition-all duration-200 hover:scale-105 active:scale-95">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-in slide-in-from-left-4 duration-500 delay-200">
                <p><strong>Name:</strong> {student.name}</p>
                <p><strong>Roll No:</strong> {student.rollNo}</p>
                <p><strong>Payment Status:</strong> <Badge variant={student.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="transition-all duration-300">{student.paymentStatus}</Badge></p>
                <p><strong>Photo Status:</strong> <Badge variant={student.photoStatus === 'Ready' ? 'default' : 'secondary'} className="transition-all duration-300">{student.photoStatus}</Badge></p>
              </div>

              {student.paymentStatus === 'UNPAID' && (
                <div className="space-y-2 animate-in fade-in-0 duration-500 delay-400">
                  <Button onClick={generatePaymentQR} disabled={generatingPaymentQR} className="transition-all duration-200 hover:scale-105 active:scale-95">
                    {generatingPaymentQR ? 'Generating...' : 'Generate Payment QR'}
                  </Button>
                  {paymentQR && <img src={paymentQR} alt="Payment QR" className="max-w-xs mx-auto animate-in zoom-in-95 duration-300" />}
                </div>
              )}

              {student.paymentStatus === 'PAID' && (
                <div className="space-y-2 animate-in fade-in-0 duration-500 delay-400">
                  <Button onClick={markAsPaid} disabled={markingPaid} className="transition-all duration-200 hover:scale-105 active:scale-95">
                    {markingPaid ? 'Generating...' : 'Generate Login QR'}
                  </Button>
                  {loginQR && <img src={loginQR} alt="Login QR" className="max-w-xs mx-auto animate-in zoom-in-95 duration-300" />}
                  {password && <p className="animate-in slide-in-from-bottom-4 duration-300 delay-600"><strong>Password:</strong> {password}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
            <CardHeader>
              <CardTitle>Photo Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-in slide-in-from-right-4 duration-500 delay-400">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="transition-all duration-200 focus:scale-105"
                />
                {uploading && <p className="animate-in fade-in-0 duration-300">Uploading...</p>}
              </div>

              <div className="animate-in slide-in-from-right-4 duration-500 delay-600">
                <label className="block text-sm font-medium mb-2">Photo Status</label>
                <select
                  value={student.photoStatus}
                  onChange={(e) => updatePhotoStatus(e.target.value)}
                  className="w-full p-2 border rounded transition-all duration-200 focus:scale-105"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Ready">Ready</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-400">
          <CardHeader>
            <CardTitle>Photos ({photosData?.photos?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              <AnimatePresence>
                {photosData?.photos?.map((photo: Photo, index: number) => (
                  <motion.div
                    key={photo.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-48 object-cover rounded transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="text-sm mt-2 truncate">{photo.name}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}