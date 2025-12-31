import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, File, Trash2, Download } from 'lucide-react';

const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserDocuments();
    }
  }, [user]);

  const loadUserDocuments = () => {
    if (!user) return;

    // Load from localStorage
    const savedFiles = localStorage.getItem(`dummyDocuments_${user.id}`);
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles));
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload PDF, Word, or image files only.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const newFile = {
        name: file.name,
        url: '#', // Dummy URL
        size: file.size,
        uploaded_at: new Date().toISOString(),
      };

      const updatedFiles = [...uploadedFiles, newFile];
      setUploadedFiles(updatedFiles);

      // Save to localStorage
      localStorage.setItem(`dummyDocuments_${user.id}`, JSON.stringify(updatedFiles));

      toast({
        title: 'Upload Successful (Demo)',
        description: 'Your document has been uploaded successfully.',
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!user) return;

    try {
      const updatedFiles = uploadedFiles.filter((f) => f.name !== fileName);
      setUploadedFiles(updatedFiles);

      // Update localStorage
      localStorage.setItem(`dummyDocuments_${user.id}`, JSON.stringify(updatedFiles));

      toast({
        title: 'File Deleted (Demo)',
        description: 'Document has been deleted successfully.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please log in to access document upload.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Upload important documents like medical forms, permission slips, or certificates.
            Maximum file size: 10MB. Supported formats: PDF, Word, JPG, PNG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document">Select Document</Label>
              <Input
                id="document"
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="mt-1"
              />
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading document...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files Section */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Your uploaded documents are stored securely and can be accessed anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} •{' '}
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
