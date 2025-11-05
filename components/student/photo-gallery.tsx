'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Download, Loader2 } from 'lucide-react'
import useSWR from 'swr'

interface Photo {
  name: string
  url: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function PhotoGallery() {
  const { data, error, isLoading } = useSWR('/api/gallery', fetcher, { refreshInterval: 5000 })
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState('')

  const downloadAll = async () => {
    setDownloading(true)
    setDownloadProgress('')
    const zip = new JSZip()
    const folder = zip.folder('photos')
    const photos = data?.photos || []

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      setDownloadProgress(`Zipping... ${i + 1}/${photos.length} photos...`)
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
    setDownloading(false)
    setDownloadProgress('')
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
    return (
      <div className="min-h-screen p-4 transition-all duration-300" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
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
  <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0A0A0A' }}>
        <Card className="w-full max-w-md shadow-lg animate-in fade-in-0 zoom-in-95 duration-500">
          <CardContent className="pt-6">
            <p className="text-center text-lg">{data.message || 'Photos not ready yet'}</p>
            <Button onClick={() => router.push('/')} className="w-full mt-4 transition-all duration-200 hover:scale-105">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 transition-all duration-300" style={{ background: '#0A0A0A' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold animate-in slide-in-from-left-4 duration-500" style={{ color: '#FF9A00', textShadow: '0 0 8px #FF9A00, 0 0 2px #fff2' }}>Your Photos</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={downloadAll} className="transition-all duration-200 hover:scale-105 active:scale-95 cosmic-btn" disabled={downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {downloading ? 'Downloading...' : 'Download All'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="transition-all duration-200 hover:scale-105 active:scale-95">Logout</Button>
          </div>
          {downloadProgress && <p className="text-sm text-soft-white mt-2 col-span-full">{downloadProgress}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.photos.map((photo: Photo, index: number) => (
            <Card key={index} className="relative group hover:shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 cosmic-card border border-orange-500" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-4">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-48 object-cover rounded mb-2 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => handleDownload(photo)} className="bg-[#FF9A00] rounded-full p-1 shadow hover:bg-orange-400 transition-all duration-200 hover:scale-110">
                    <Download size={16} color="#0A0A0A" />
                  </button>
                </div>
                <p className="text-sm text-soft-white mb-2 truncate">{photo.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}