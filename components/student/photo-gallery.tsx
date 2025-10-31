'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Download } from 'lucide-react'
import useSWR from 'swr'

interface Photo {
  name: string
  url: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function PhotoGallery() {
  const { data, error, isLoading } = useSWR('/api/gallery', fetcher, { refreshInterval: 5000 })
  const router = useRouter()

  const downloadAll = async () => {
    const zip = new JSZip()
    const folder = zip.folder('photos')

    for (const photo of data?.photos || []) {
      try {
        const response = await fetch(`${photo.url}?tr=f-orig`)
        const blob = await response.blob()
        folder?.file(photo.name, blob)
      } catch (err) {
        console.error(`Failed to download ${photo.name}`)
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, 'photos.zip')
  }

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(`${photo.url}?tr=f-orig`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(`Failed to download ${photo.name}`)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-lg">Failed to load photos</p>
            <Button onClick={() => router.push('/')} className="w-full mt-4">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data.photos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-lg">{data.message || 'Photos not ready yet'}</p>
            <Button onClick={() => router.push('/')} className="w-full mt-4">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Photos</h1>
          <div className="space-x-2">
            <Button onClick={downloadAll}>Download All</Button>
            <Button variant="outline" onClick={() => router.push('/')}>Logout</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.photos.map((photo: Photo, index: number) => (
            <Card key={index} className="relative group">
              <CardContent className="p-4">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownload(photo)} className="bg-white rounded-full p-1 shadow hover:bg-gray-100">
                    <Download size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{photo.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}