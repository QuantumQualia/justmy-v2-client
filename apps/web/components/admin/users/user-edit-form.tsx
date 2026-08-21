"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { UserRole } from "@/lib/services/users"

type UserEditFormData = {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

type UserEditFormProps = {
  initialData?: Partial<UserEditFormData>
  onChange?: (data: UserEditFormData) => void
}

export function UserEditForm({ initialData, onChange }: UserEditFormProps) {
  const [formData, setFormData] = useState<UserEditFormData>({
    email: initialData?.email || "",
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    role: initialData?.role || "USER",
  })
  const isInitialMount = useRef(true)
  const prevInitialDataRef = useRef<string>("")

  // Update form data when initialData changes (but not on initial mount)
  useEffect(() => {
    if (!initialData) return

    // Create a string representation to compare
    const initialDataKey = JSON.stringify(initialData)
    
    // Skip if this is the same data we've already processed
    if (prevInitialDataRef.current === initialDataKey) {
      return
    }

    // Skip on initial mount - we already set initial values in useState
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevInitialDataRef.current = initialDataKey
      return
    }

    prevInitialDataRef.current = initialDataKey
    setFormData((prev) => ({
      email: initialData.email ?? prev.email,
      firstName: initialData.firstName ?? prev.firstName,
      lastName: initialData.lastName ?? prev.lastName,
      role: initialData.role ?? prev.role,
    }))
  }, [initialData])

  // Notify parent of changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return
    onChange?.(formData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  const handleChange = (field: keyof UserEditFormData, value: string | UserRole) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">User Information</CardTitle>
        <CardDescription className="text-muted-foreground">
          Update user details and role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="user@example.com"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-muted-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="John"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-muted-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Doe"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-muted-foreground">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => handleChange("role", value)}
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

