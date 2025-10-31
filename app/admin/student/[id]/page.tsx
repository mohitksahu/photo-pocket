'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import QRCode from 'qrcode'
import { Trash2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: photosData, error: photosError, isLoading: photosLoading } = useSWR(
    student ? `/api/admin/gallery/${student.rollNo}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const generatePaymentQR = async () => {
    if (!student) return
    const upiLink = `upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'your_upi_id@bank'}&pn=Fest%20Photos&tr=${student.rollNo}&am=50.00`
    try {
      const qr = await QRCode.toDataURL(upiLink)
      setPaymentQR(qr)
    } catch (err) {
      console.error('Failed to generate QR')
    }
  }

  const markAsPaid = async () => {
    if (!student) return
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center">Student not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{student.name} - {student.rollNo}</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => { document.cookie = 'admin-auth=; path=/; max-age=0'; router.push('/admin') }}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p><strong>Name:</strong> {student.name}</p>
                <p><strong>Roll No:</strong> {student.rollNo}</p>
                <p><strong>Payment Status:</strong> <Badge variant={student.paymentStatus === 'PAID' ? 'default' : 'secondary'}>{student.paymentStatus}</Badge></p>
                <p><strong>Photo Status:</strong> <Badge variant={student.photoStatus === 'Ready' ? 'default' : 'secondary'}>{student.photoStatus}</Badge></p>
              </div>

              {student.paymentStatus === 'UNPAID' && (
                <div className="space-y-2">
                  <Button onClick={generatePaymentQR}>Generate Payment QR</Button>
                  {paymentQR && <img src={paymentQR} alt="Payment QR" className="max-w-xs" />}
                </div>
              )}

              {student.paymentStatus === 'PAID' && (
                <div className="space-y-2">
                  <Button onClick={markAsPaid}>Generate Login QR</Button>
                  {loginQR && <img src={loginQR} alt="Login QR" className="max-w-xs" />}
                  {password && <p><strong>Password:</strong> {password}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <p>Uploading...</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Photo Status</label>
                <select
                  value={student.photoStatus}
                  onChange={(e) => updatePhotoStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Ready">Ready</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photos ({photosData?.photos?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photosData?.photos?.map((photo: Photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-48 object-cover rounded"
                  />
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                  <p className="text-sm mt-2">{photo.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}