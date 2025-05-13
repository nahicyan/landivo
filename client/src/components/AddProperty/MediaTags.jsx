// client/src/components/AddProperty/MediaTags.jsx
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tag, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import ImageUploadPreview from "@/components/ImageUploadPreview/ImageUploadPreview";
import VideoUploadPreview from "@/components/VideoUploadPreview/VideoUploadPreview";

export default function MediaTags({
  formData,
  handleChange,
  uploadedImages,
  setUploadedImages,
  existingImages = [],
  setExistingImages = () => {},
  uploadedVideos,
  setUploadedVideos,
  existingVideos = [],
  setExistingVideos = () => {},
    errors = {},
}) {
  const hasExistingImages = Array.isArray(existingImages) && existingImages.length > 0;
  const hasNewImages = Array.isArray(uploadedImages) && uploadedImages.length > 0;
  const hasImages = hasExistingImages || hasNewImages;
  
  const hasExistingVideos = Array.isArray(existingVideos) && existingVideos.length > 0;
  const hasNewVideos = Array.isArray(uploadedVideos) && uploadedVideos.length > 0;
  const hasVideos = hasExistingVideos || hasNewVideos;

  return (
    <Card className="border border-gray-200 shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="p-1.5 rounded-full bg-primary/10 mr-3">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          Media & Tags
        </CardTitle>
      </CardHeader>

      <CardContent>
         {/* Add error message for images */}
        {errors.images && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.images}</p>
          </div>
        )}
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="images" className="flex items-center gap-2 flex-1">
              <ImageIcon className="h-4 w-4" />
              Images
              {hasImages && (
                <Badge variant="secondary" className="ml-1">
                  {(existingImages?.length || 0) + (uploadedImages?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2 flex-1">
              <VideoIcon className="h-4 w-4" />
              Videos
              {hasVideos && (
                <Badge variant="secondary" className="ml-1">
                  {(existingVideos?.length || 0) + (uploadedVideos?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2 flex-1">
              <Tag className="h-4 w-4" />
              Tags
              {(formData.ltag || formData.rtag) && (
                <Badge variant="secondary" className="ml-1">
                  {[formData.ltag, formData.rtag].filter(Boolean).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="mt-0">
            <div className="space-y-4">
              <div className="p-1">
                <ImageUploadPreview
                  existingImages={existingImages}
                  newImages={uploadedImages}
                  onExistingChange={setExistingImages}
                  onNewChange={setUploadedImages}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-0">
            <div className="space-y-4">
              <div className="p-1">
                <VideoUploadPreview
                  existingVideos={existingVideos}
                  newVideos={uploadedVideos}
                  onExistingChange={setExistingVideos}
                  onNewChange={setUploadedVideos}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="mt-0">
            <div className="space-y-6">
              {/* Preview of how tags will look */}
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-500 mb-3">Tag Preview</p>
                <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                  {/* Property image placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                  
                  {/* Left tag */}
                  {formData.ltag && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-primary text-white font-medium px-3 py-1">
                        {formData.ltag}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Right tag */}
                  {formData.rtag && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-accent text-white font-medium px-3 py-1">
                        {formData.rtag}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags input fields - Horizontal layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Tag */}
                <div className="space-y-2">
                  <Label htmlFor="ltag" className="text-gray-700">
                    Left Tag
                  </Label>
                  <div className="relative">
                    <Input
                      id="ltag"
                      name="ltag"
                      type="text"
                      value={formData.ltag || ""}
                      onChange={handleChange}
                      placeholder="e.g., Featured, Hot Deal"
                      className="pl-9 border-gray-300 focus-visible:ring-primary"
                      maxLength={20}
                    />
                    <div className="absolute left-2.5 top-2.5 text-gray-400">
                      <Tag className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    This tag appears on the left side of the property image
                  </p>
                </div>

                {/* Right Tag */}
                <div className="space-y-2">
                  <Label htmlFor="rtag" className="text-gray-700">
                    Right Tag
                  </Label>
                  <div className="relative">
                    <Input
                      id="rtag"
                      name="rtag"
                      type="text"
                      value={formData.rtag || ""}
                      onChange={handleChange}
                      placeholder="e.g., New, Sale, Reduced"
                      className="pl-9 border-gray-300 focus-visible:ring-primary"
                      maxLength={20}
                    />
                    <div className="absolute left-2.5 top-2.5 text-gray-400">
                      <Tag className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    This tag appears on the right side of the property image
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}