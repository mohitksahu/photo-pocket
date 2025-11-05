'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StudentLoginForm() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Pre-fill form from URL parameters (for QR code login)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const phoneNumberParam = urlParams.get('phoneNumber')
      const passwordParam = urlParams.get('password')
      
      if (phoneNumberParam) setPhoneNumber(phoneNumberParam)
      if (passwordParam) setPassword(passwordParam)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
      })

      if (res.ok) {
        router.push('/gallery')
      } else {
        const data = await res.json()
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 transition-all duration-300">
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2 animate-in slide-in-from-top-4 duration-700">Sankalp presents</CardTitle>
          <CardTitle className="text-xl animate-in slide-in-from-bottom-4 duration-700 delay-200">PhotoPocket 3.0</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-in slide-in-from-left-4 duration-500 delay-300">
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">Phone Number</label>
              <Input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="Enter your phone number"
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
            <div className="animate-in slide-in-from-right-4 duration-500 delay-500">
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="transition-all duration-200 focus:scale-105"
              />
            </div>
            {error && <p className="text-red-500 text-sm animate-in fade-in-0 duration-300">{error}</p>}
            <Button type="submit" className="w-full transition-all duration-200 hover:scale-105 active:scale-95" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}