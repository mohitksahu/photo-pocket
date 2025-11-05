'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simple check, in production use proper auth
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      document.cookie = 'admin-auth=true; path=/; max-age=86400' // 24 hours
      router.push('/admin/dashboard')
    } else {
      setError('Invalid password')
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-300"
      style={{ background: '#0A0A0A' }}
    >
      <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 zoom-in-95 duration-500 cosmic-card border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold animate-in slide-in-from-top-4 duration-700" style={{ color: '#FF9A00', textShadow: '0 0 8px #FF9A00' }}>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-in slide-in-from-left-4 duration-500 delay-300">
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-soft-white">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter admin password"
                className="transition-all duration-200 focus:scale-105 bg-[#1A1A1A] border-orange-500 text-soft-white placeholder-gray-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm animate-in fade-in-0 duration-300">{error}</p>}
            <Button type="submit" className="w-full transition-all duration-200 hover:scale-105 active:scale-95 cosmic-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}