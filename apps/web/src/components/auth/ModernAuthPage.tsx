import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IconUser, 
  IconLock, 
  IconMail, 
  IconPhone,
  IconSparkles,
  IconArrowRight,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import { notifications } from '@mantine/notifications'
import '../../styles/modern-theme.css'

export function ModernAuthPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuthStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    userRole: 'consultant' as const
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isSignUp) {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          user_role: formData.userRole
        })
        
        if (result.success) {
          notifications.show({
            title: 'Welcome!',
            message: 'Account created successfully',
            color: 'green'
          })
          navigate('/')
        } else {
          notifications.show({
            title: 'Error',
            message: result.error || 'Failed to create account',
            color: 'red'
          })
        }
      } else {
        const result = await signIn(formData.email, formData.password)
        
        if (result.success) {
          notifications.show({
            title: 'Welcome back!',
            message: 'Signed in successfully',
            color: 'green'
          })
          navigate('/')
        } else {
          notifications.show({
            title: 'Error',
            message: result.error || 'Invalid credentials',
            color: 'red'
          })
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-violet-50 to-pink-50" />
        <div className="absolute inset-0 noise-texture" />
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-violet-400 rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Logo */}
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur-2xl opacity-50 animate-pulse-glow" />
              <div className="relative bg-gradient-to-r from-blue-600 to-violet-600 p-4 rounded-2xl">
                <IconSparkles size={40} className="text-white" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-2">
              <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </span>
            </h2>
            <p className="text-gray-600">
              {isSignUp ? 'Join our AI-powered platform' : 'Sign in to continue'}
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>

            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <IconArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </form>

          {/* Toggle */}
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
