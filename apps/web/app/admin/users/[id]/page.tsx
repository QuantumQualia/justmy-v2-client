"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { UserEditForm } from "@/components/admin/users/user-edit-form"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { usersService, ApiClientError } from "@/lib/services/users"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedUserIdRef = useRef<string | null>(null)
  const fetchingRef = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) return

    // Skip if we've already successfully fetched this userId
    if (fetchedUserIdRef.current === userId && formData) {
      setLoading(false)
      return
    }

    // Skip if we're already fetching this userId
    if (fetchingRef.current === userId) {
      return
    }

    fetchingRef.current = userId

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        // Convert userId to number for the API (endpoint expects ParseIntPipe)
        const userIdNum = parseInt(userId, 10)
        if (isNaN(userIdNum)) {
          throw new Error("Invalid user ID")
        }
        const user = await usersService.getUserById(userIdNum)

        // Check if userId changed
        if (fetchedUserIdRef.current !== userId && fetchingRef.current !== userId) {
          return
        }

        fetchedUserIdRef.current = userId

        // Map API response to form data format
        setFormData({
          email: user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role as "USER" | "ADMIN",
        })
      } catch (err) {
        // Don't set error if userId changed
        if (fetchingRef.current !== userId) {
          return
        }
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to load user. Please try again."
        setError(errorMessage)
      } finally {
        // Only update loading if we're still on the same userId
        if (fetchingRef.current === userId) {
          setLoading(false)
          fetchingRef.current = null
        }
      }
    }

    fetchUser()
  }, [userId, formData])

  const handleSave = async () => {
    if (!formData) return

    setSaving(true)
    setError(null)
    try {
      // Convert userId to number for the API (endpoint expects ParseIntPipe)
      const userIdNum = parseInt(userId, 10)
      if (isNaN(userIdNum)) {
        throw new Error("Invalid user ID")
      }

      // Map form data to API format (only include fields that have values)
      const updateData: any = {}
      if (formData.email) updateData.email = formData.email
      if (formData.firstName) updateData.firstName = formData.firstName
      if (formData.lastName) updateData.lastName = formData.lastName
      if (formData.role) updateData.role = formData.role

      await usersService.updateUser(userIdNum, updateData)

      router.push("/admin/users")
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update user. Please try again."
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit User</h1>
            <p className="text-slate-400">User ID: {userId}</p>
          </div>
          <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading user data...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit User</h1>
          <p className="text-slate-400">User ID: {userId}</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-800 bg-red-900/20 p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="border border-dashed border-slate-700 p-8 rounded-xl bg-slate-900/30">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving || !formData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            <div>
              <UserEditForm
                initialData={formData}
                onChange={(data) => setFormData(data)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

