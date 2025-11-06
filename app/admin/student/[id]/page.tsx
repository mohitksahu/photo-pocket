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
  phoneNumber: string
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
  const [uploadProgress, setUploadProgress] = useState('')
  const [polaroidQuantity, setPolaroidQuantity] = useState(0)
  const [albumQuantity, setAlbumQuantity] = useState(0)
  const [generatingPaymentQR, setGeneratingPaymentQR] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: photosData, error: photosError, isLoading: photosLoading } = useSWR(
    student ? `/api/admin/gallery/${student.phoneNumber}` : null,
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
    const totalAmount = (polaroidQuantity * 20) + (albumQuantity * 25)
    const upiLink = `upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || 'your_upi_id@bank'}&pn=Fest%20Photos&tr=${student.phoneNumber}&am=${totalAmount}.00`
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
        body: JSON.stringify({ 
          phoneNumber: student.phoneNumber,
          polaroidQuantity,
          albumQuantity
        })
      })
      if (res.ok) {
        const data = await res.json()
        setPassword(data.password)
        // Create a URL that pre-fills the login form
        const loginUrl = `${window.location.origin}?phoneNumber=${encodeURIComponent(student.phoneNumber)}&password=${encodeURIComponent(data.password)}`
        const qr = await QRCode.toDataURL(loginUrl)
        setLoginQR(qr)
        // Refetch student to update status
        const studentRes = await fetch(`/api/student/${id}`)
        if (studentRes.ok) {
          const studentData = await studentRes.json()
          setStudent(studentData.student)
        }
      }
    } catch (err) {
      console.error('Failed to mark as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  const generateLoginQR = async () => {
    if (!student) return
    setMarkingPaid(true)
    try {
      // Fetch the plain password from the database
      const res = await fetch(`/api/student/${id}`)
      if (res.ok) {
        const data = await res.json()
        const plainPassword = data.student.plainPassword
        if (!plainPassword) {
          console.error('Password not available for student:', student.phoneNumber)
          // For now, show an error message instead of trying to regenerate
          alert('Password not available. The student may need to be marked as paid again.')
          return
        }
        const loginUrl = `${window.location.origin}?phoneNumber=${encodeURIComponent(student.phoneNumber)}&password=${encodeURIComponent(plainPassword)}`
        const qr = await QRCode.toDataURL(loginUrl)
        setLoginQR(qr)
        setPassword(plainPassword) // Set in state for display
      }
    } catch (err) {
      console.error('Failed to generate login QR:', err)
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !student) return

    // Validate files before upload
    const validFiles = []
    const invalidFiles = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: Not an image file`)
        continue
      }
      
      validFiles.push(file)
    }

    if (invalidFiles.length > 0) {
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`)
    }

    if (validFiles.length === 0) {
      alert('No valid files to upload')
      return
    }

    setUploading(true)
    setUploadProgress('')
    const uploadResults = []
    let successCount = 0

    try {
      // Upload each valid file with fresh auth params
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setUploadProgress(`Uploading ${i + 1}/${validFiles.length}: ${file.name}...`)

        try {
          // Get fresh auth params for each file
          const authRes = await fetch('/api/imagekit-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: student.phoneNumber })
          })
          
          if (!authRes.ok) {
            const authError = await authRes.json()
            console.error('Failed to get auth params:', authError)
            uploadResults.push({ file: file.name, success: false, error: { message: 'Failed to get upload authentication' } })
            continue
          }
          
          const auth = await authRes.json()
          
          // Validate auth params
          if (!auth.signature || !auth.token || !auth.expire) {
            console.error('Invalid auth params:', auth)
            uploadResults.push({ file: file.name, success: false, error: { message: 'Invalid upload authentication parameters' } })
            continue
          }

          const formData = new FormData()
          formData.append('file', file)
          formData.append('fileName', file.name)
          formData.append('folder', auth.folder)
          formData.append('signature', auth.signature)
          formData.append('expire', auth.expire.toString())
          formData.append('token', auth.token)
          formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!)

          const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: formData
          })

          console.log(`Upload response for ${file.name}:`, {
            status: uploadRes.status,
            statusText: uploadRes.statusText,
            headers: Object.fromEntries(uploadRes.headers.entries())
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            uploadResults.push({ file: file.name, success: true, data: uploadData })
            successCount++
          } else {
            let errorData = {}
            try {
              errorData = await uploadRes.json()
            } catch (jsonError) {
              // If JSON parsing fails, create a custom error object
              errorData = { 
                message: `HTTP ${uploadRes.status}: ${uploadRes.statusText}`,
                status: uploadRes.status,
                statusText: uploadRes.statusText
              }
            }
            uploadResults.push({ file: file.name, success: false, error: errorData })
            console.error(`Failed to upload ${file.name}:`, {
              status: uploadRes.status,
              statusText: uploadRes.statusText,
              errorData,
              auth: {
                folder: auth.folder,
                expire: auth.expire,
                hasSignature: !!auth.signature,
                hasToken: !!auth.token
              }
            })
          }
        } catch (fileError) {
          uploadResults.push({ file: file.name, success: false, error: fileError })
          console.error(`Error uploading ${file.name}:`, fileError)
        }
      }

      setUploadProgress('')

      // Show results
      if (successCount === validFiles.length) {
        alert(`All ${successCount} photos uploaded successfully!`)
        // Automatically set photo status to Ready after successful upload
        await updatePhotoStatus('Ready')
      } else if (successCount > 0) {
        alert(`${successCount} out of ${validFiles.length} photos uploaded successfully. Check console for details.`)
        // Automatically set photo status to Ready if at least one photo was uploaded
        await updatePhotoStatus('Ready')
      } else {
        alert('Failed to upload any photos. Check console for details.')
      }

      // Refresh the gallery if any uploads succeeded
      if (successCount > 0) {
        mutate(`/api/admin/gallery/${student.phoneNumber}`)
      }
    } catch (err) {
      console.error('Upload setup failed:', err)
      alert('Failed to setup upload. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress('')
      // Clear the file input
      e.target.value = ''
    }
  }

  const deletePhoto = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      const res = await fetch(`/api/image/${imageId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        mutate(`/api/admin/gallery/${student!.phoneNumber}`)
      } else {
        alert('Failed to delete photo')
      }
    } catch (err) {
      console.error('Delete failed')
      alert('Delete failed')
    }
  }

  const refreshData = async () => {
    if (!student) return
    try {
      // Refetch student data
      const studentRes = await fetch(`/api/student/${id}`)
      if (studentRes.ok) {
        const studentData = await studentRes.json()
        setStudent(studentData.student)
      }
      // Refetch photos
      mutate(`/api/admin/gallery/${student.phoneNumber}`)
    } catch (err) {
      console.error('Failed to refresh data')
    }
  }

  const updatePhotoStatus = async (status: string) => {
    if (!student) return
    try {
      await fetch('/api/student/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: student.phoneNumber, status })
      })
      // Update local state to reflect the change immediately
      setStudent({ ...student, photoStatus: status })
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
    <div className="min-h-screen p-4 transition-all duration-300" style={{ background: '#0A0A0A' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold animate-in slide-in-from-left-4 duration-500" style={{ color: '#FF9A00', textShadow: '0 0 8px #FF9A00' }}>{student.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{student.phoneNumber}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')} className="transition-all duration-200 hover:scale-105 active:scale-95 border-orange-500 text-orange-400 bg-[#0E0E0E] hover:bg-orange-900/20">
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={refreshData} className="transition-all duration-200 hover:scale-105 active:scale-95 border-orange-500 text-orange-400 bg-[#0E0E0E] hover:bg-orange-900/20">
              Refresh Data
            </Button>
            <Button onClick={() => { document.cookie = 'admin-auth=; path=/; max-age=0'; router.push('/admin') }} className="transition-all duration-200 hover:scale-105 active:scale-95 cosmic-btn">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 cosmic-card border border-orange-500">
            <CardHeader>
              <CardTitle style={{ color: '#FF9A00' }}>Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="animate-in slide-in-from-left-4 duration-500 delay-200 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-orange-500/30">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-soft-white font-medium">{student.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-orange-500/30">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="text-soft-white font-medium">{student.phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-orange-500/30">
                  <span className="text-gray-400">Payment Status:</span>
                  <Badge className={student.paymentStatus === 'PAID' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}>
                    {student.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Photo Status:</span>
                  <Badge className={student.photoStatus === 'Ready' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}>
                    {student.photoStatus}
                  </Badge>
                </div>
              </div>

              {/* Payment QR Generation - Always Available */}
              <div className="space-y-4 animate-in fade-in-0 duration-500 delay-400 border-t border-orange-500/30 pt-6">
                <h3 className="text-orange-400 font-semibold">Payment Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-300">Polaroid Prints (₹20 each)</label>
                    <select
                      value={polaroidQuantity}
                      onChange={(e) => setPolaroidQuantity(Number(e.target.value))}
                      className="w-full p-2 border border-orange-500 rounded bg-[#1A1A1A] text-soft-white transition-all duration-200 focus:ring-2 focus:ring-orange-500/50"
                    >
                      {Array.from({ length: 11 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-300">Album Prints (₹25 each)</label>
                    <select
                      value={albumQuantity}
                      onChange={(e) => setAlbumQuantity(Number(e.target.value))}
                      className="w-full p-2 border border-orange-500 rounded bg-[#1A1A1A] text-soft-white transition-all duration-200 focus:ring-2 focus:ring-orange-500/50"
                    >
                      {Array.from({ length: 11 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">Total Amount:</div>
                  <div className="text-2xl font-bold text-orange-400">₹{(polaroidQuantity * 20) + (albumQuantity * 25)}</div>
                </div>
                <Button onClick={generatePaymentQR} disabled={generatingPaymentQR || (polaroidQuantity === 0 && albumQuantity === 0)} className="w-full cosmic-btn">
                  {generatingPaymentQR ? 'Generating...' : `Generate ₹${(polaroidQuantity * 20) + (albumQuantity * 25)} Payment QR`}
                </Button>
                {generatingPaymentQR ? (
                  <div className="text-center text-gray-400">Generating QR...</div>
                ) : paymentQR ? (
                  <img src={paymentQR} alt={`Payment QR for ₹${(polaroidQuantity * 20) + (albumQuantity * 25)}`} className="max-w-xs mx-auto animate-in zoom-in-95 duration-300" />
                ) : (
                  <div className="text-center text-gray-400">No QR generated yet.</div>
                )}
              </div>

              {student.paymentStatus === 'UNPAID' && (
                <div className="space-y-2 animate-in fade-in-0 duration-500 delay-400 border-t border-orange-500/30 pt-6">
                  <Button onClick={markAsPaid} disabled={markingPaid} className="w-full cosmic-btn">
                    {markingPaid ? 'Processing...' : 'Mark as Paid'}
                  </Button>
                </div>
              )}

              {student.paymentStatus === 'PAID' && (
                <div className="space-y-4 animate-in fade-in-0 duration-500 delay-400 border-t border-orange-500/30 pt-6">
                  <Button onClick={generateLoginQR} disabled={markingPaid} className="w-full cosmic-btn">
                    {markingPaid ? 'Generating...' : 'Generate Login QR'}
                  </Button>
                  {markingPaid ? (
                    <div className="text-center text-gray-400">Generating QR...</div>
                  ) : loginQR ? (
                    <img src={loginQR} alt="Login QR" className="max-w-xs mx-auto animate-in zoom-in-95 duration-300 rounded border border-orange-500/30" />
                  ) : (
                    <div className="text-center text-gray-400">No QR generated yet.</div>
                  )}
                  {password && <p className="animate-in slide-in-from-bottom-4 duration-300 delay-600 text-center bg-orange-500/10 border border-orange-500/30 rounded p-3"><span className="text-gray-400">Password: </span><span className="text-orange-400 font-semibold">{password}</span></p>}
                </div>
              )}
            </CardContent>
          </Card>

          {student.paymentStatus === 'PAID' && (
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200 cosmic-card border border-orange-500">
              <CardHeader>
                <CardTitle style={{ color: '#FF9A00' }}>Photo Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="animate-in slide-in-from-right-4 duration-500 delay-400">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload Photos</label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="transition-all duration-200 focus:ring-2 focus:ring-orange-500/50 border-orange-500 bg-[#1A1A1A] text-soft-white"
                  />
                  {uploading && <p className="animate-in fade-in-0 duration-300 text-orange-400 mt-2">{uploadProgress || 'Uploading...'}</p>}
                </div>

                <div className="animate-in slide-in-from-right-4 duration-500 delay-600">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Photo Status</label>
                  <select
                    value={student.photoStatus}
                    onChange={(e) => updatePhotoStatus(e.target.value)}
                    className="w-full p-2 border border-orange-500 rounded bg-[#1A1A1A] text-soft-white transition-all duration-200 focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Ready">Ready</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {student.paymentStatus === 'PAID' && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-400 cosmic-card border border-orange-500">
            <CardHeader>
              <CardTitle style={{ color: '#FF9A00' }}>Photos ({photosData?.photos?.length || 0})</CardTitle>
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
        )}
      </div>
    </div>
  )
}