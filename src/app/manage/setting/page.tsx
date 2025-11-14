"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import { useAccountProfile, useUpdateProfileMutation } from "@/queries/useAccount";
import { UpdateProfileBody, UpdateProfileBodyType } from "@/schemaValidations/account.schema";
import { handleErrorApi } from "@/lib/utils";
import fileApiRequest from "@/apiRequests/file";
import MediaLibraryDialog from "@/components/common/media-library-dialog";

export default function SettingPage() {
  const { data: profileData, isLoading } = useAccountProfile();
  const updateProfileMutation = useUpdateProfileMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [showAvatarLibrary, setShowAvatarLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const account = profileData?.payload?.data;
  const userId = account?.id || '';

  const form = useForm<UpdateProfileBodyType>({
    resolver: zodResolver(UpdateProfileBody),
    defaultValues: {
      username: account?.username || "",
      avatar: account?.avatar || null,
    },
    values: {
      username: account?.username || "",
      avatar: account?.avatar || null,
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "Error", 
        description: "Please select an image file", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ 
        title: "Error", 
        description: "File size must be less than 10MB", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('altText', `${account?.username} avatar`);
      formData.append('caption', 'User avatar');

      const response = await fileApiRequest.uploadFile(formData);
      
      if (response.payload?.data?.cloudinarySecureUrl) {
        form.setValue('avatar', response.payload.data.cloudinarySecureUrl);
        toast({ description: "Avatar uploaded successfully" });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to upload avatar", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (values: UpdateProfileBodyType) => {
    if (updateProfileMutation.isPending) return;

    try {
      await updateProfileMutation.mutateAsync(values);
      toast({ description: "Profile updated successfully" });
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update profile", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your profile information and avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.watch('avatar') || undefined} alt={account?.username} />
                  <AvatarFallback className="text-2xl">
                    {account?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Enter avatar URL or upload" 
                            value={field.value || ''} 
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setShowAvatarLibrary(true)}
                            disabled={isUploading}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Choose
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? "Uploading..." : "Upload"}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Username Field */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <Input placeholder="Enter your username" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input value={account?.email || ''} disabled />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Role (Read-only) */}
              <div className="space-y-2">
                <FormLabel>Role</FormLabel>
                <Input value={account?.roles?.[0] || 'N/A'} disabled />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfileMutation.isPending || isUploading}>
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Media Library Dialog */}
      <MediaLibraryDialog
        open={showAvatarLibrary}
        onOpenChange={setShowAvatarLibrary}
        onSelectFile={(file) => {
          form.setValue('avatar', file.cloudinarySecureUrl);
          setShowAvatarLibrary(false);
        }}
        userId={userId}
        mediaType="IMAGE"
        title="Select Avatar"
      />
    </div>
  );
}
