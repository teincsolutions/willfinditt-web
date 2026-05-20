'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import {
  useMySeller,
  useMyVerification,
  useSubmitVerification,
  useUpdateMyVerification,
} from '@/hooks/useSeller';
import { uploadSingle } from '@/services/upload.service';
import { Button } from '@/components/Button';

interface VerificationFormData {
  documentType: 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT';
  documentNumber: string;
  fullName?: string;
  documentIssueDate?: string;
  documentExpiryDate?: string;
  address: string;
  additionalNotes?: string;
}

const schema = yup.object({
  documentType: yup
    .mixed<'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT'>()
    .oneOf(['NATIONAL_ID', 'DRIVERS_LICENSE', 'PASSPORT'])
    .required('Document type is required'),
  documentNumber: yup.string().trim().required('Document number is required'),
  fullName: yup.string().trim().optional(),
  documentIssueDate: yup.string().optional(),
  documentExpiryDate: yup.string().optional(),
  address: yup.string().trim().required('Address is required'),
  additionalNotes: yup.string().trim().optional(),
});

function getStatusBadge(status: string) {
  if (status === 'APPROVED') {
    return 'bg-successLight text-success border-success/20';
  }
  if (status === 'REJECTED') {
    return 'bg-errorLight text-error border-error/20';
  }
  if (status === 'EXPIRED') {
    return 'bg-background-primary text-text-gray border-border-custom';
  }
  return 'bg-yellow/10 text-brown border-yellow/20';
}

export default function VerificationPage() {
  const router = useRouter();
  const { data: mySeller, isLoading: isSellerLoading } = useMySeller();
  const { data: myVerification, isLoading: isVerificationLoading } = useMyVerification();
  const submitMutation = useSubmitVerification();
  const updateMutation = useUpdateMyVerification();

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [faceFiles, setFaceFiles] = useState<File[]>([]);

  const isPendingVerification = myVerification?.status === 'PENDING';
  const isSubmitting = submitMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      documentType: (myVerification?.documentType as VerificationFormData['documentType']) ||
        'NATIONAL_ID',
      documentNumber: myVerification?.documentNumber || '',
      fullName: myVerification?.fullName || '',
      documentIssueDate: myVerification?.documentIssueDate?.slice(0, 10) || '',
      documentExpiryDate: myVerification?.documentExpiryDate?.slice(0, 10) || '',
      address: myVerification?.address || '',
      additionalNotes: myVerification?.additionalNotes || '',
    },
    values: {
      documentType: (myVerification?.documentType as VerificationFormData['documentType']) ||
        'NATIONAL_ID',
      documentNumber: myVerification?.documentNumber || '',
      fullName: myVerification?.fullName || '',
      documentIssueDate: myVerification?.documentIssueDate?.slice(0, 10) || '',
      documentExpiryDate: myVerification?.documentExpiryDate?.slice(0, 10) || '',
      address: myVerification?.address || '',
      additionalNotes: myVerification?.additionalNotes || '',
    },
  });

  const handleDocumentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocumentFiles(files);
  };

  const handleFaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFaceFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return [];

    const uploads = await Promise.all(
      files.map((file) => uploadSingle(file, 'USER_CONTENT'))
    );

    return uploads;
  };

  const onSubmit = async (values: VerificationFormData) => {
    if (!mySeller?.id) {
      toast.error('Please create a business profile first');
      return;
    }

    if (!myVerification && documentFiles.length < 1) {
      toast.error('Upload at least one document image');
      return;
    }

    if (!myVerification && faceFiles.length !== 3) {
      toast.error('Upload exactly 3 face photos (front, left, right)');
      return;
    }

    try {
      const documentUrls = await uploadFiles(documentFiles);
      const faceUrls = await uploadFiles(faceFiles);

      const payload = {
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        fullName: values.fullName || undefined,
        documentIssueDate: values.documentIssueDate || undefined,
        documentExpiryDate: values.documentExpiryDate || undefined,
        address: values.address,
        additionalNotes: values.additionalNotes || undefined,
        ...(documentUrls.length ? { documents: documentUrls } : {}),
        ...(faceUrls.length ? { facePhoto: faceUrls } : {}),
      };

      if (myVerification?.id) {
        await updateMutation.mutateAsync({
          verificationId: myVerification.id,
          data: payload,
        });
        toast.success('Verification updated successfully');
      } else {
        await submitMutation.mutateAsync({
          sellerProfileId: mySeller.id,
          ...payload,
          facePhoto: faceUrls,
        });
        toast.success('Verification submitted successfully');
      }

      router.push('/account/business');
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || 'Failed to submit verification'
      );
    }
  };

  if (isSellerLoading || isVerificationLoading) {
    return <div className="py-10 text-center text-text-gray">Loading verification...</div>;
  }

  if (!mySeller) {
    return (
      <div className="max-w-2xl mx-auto text-center py-14">
        <h2 className="text-2xl font-bold text-text mb-3">No Business Profile Found</h2>
        <p className="text-text-gray mb-6">
          You need to create your business profile before submitting verification.
        </p>
        <Link href="/account/business/edit">
          <Button>Create Business Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">Business Verification</h2>
        <p className="text-text-gray mt-1">
          Submit your documents and face photos to become a verified seller.
        </p>
      </div>

      {myVerification && (
        <div className="rounded-lg border border-border-custom bg-background p-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(myVerification.status)}`}>
              {myVerification.status}
            </span>
            <span className="text-sm text-text-gray">Current verification status</span>
          </div>
          {myVerification.reviewNotes && (
            <p className="text-sm text-text-gray mt-2">Review notes: {myVerification.reviewNotes}</p>
          )}
          {myVerification.rejectionReason && (
            <p className="text-sm text-error mt-2">Rejection reason: {myVerification.rejectionReason}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">Document Type</label>
            <select
              {...register('documentType')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NATIONAL_ID">National ID</option>
              <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
              <option value="PASSPORT">Passport</option>
            </select>
            {errors.documentType && (
              <p className="text-error text-sm mt-1">{errors.documentType.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Document Number</label>
            <input
              {...register('documentNumber')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter document number"
            />
            {errors.documentNumber && (
              <p className="text-error text-sm mt-1">{errors.documentNumber.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">Full Name</label>
          <input
            {...register('fullName')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Name as shown on document"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">Document Issue Date</label>
            <input
              type="date"
              {...register('documentIssueDate')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Document Expiry Date</label>
            <input
              type="date"
              {...register('documentExpiryDate')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">Address</label>
          <textarea
            {...register('address')}
            rows={3}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your physical address"
          />
          {errors.address && <p className="text-error text-sm mt-1">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">Document Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleDocumentsChange}
              className="w-full border border-border-custom rounded-lg px-3 py-2"
              disabled={isPendingVerification || isSubmitting}
            />
            <p className="text-xs text-text-light-gray mt-1">Upload clear document photos.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Face Photos (3 images)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFaceChange}
              className="w-full border border-border-custom rounded-lg px-3 py-2"
              disabled={isPendingVerification || isSubmitting}
            />
            <p className="text-xs text-text-light-gray mt-1">Front, left, and right face photos.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">Additional Notes</label>
          <textarea
            {...register('additionalNotes')}
            rows={3}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Optional notes for reviewers"
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/account/business')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPendingVerification || isSubmitting}>
            {isSubmitting
              ? 'Submitting...'
              : myVerification
                ? 'Re-submit Verification'
                : 'Start Verification'}
          </Button>
        </div>

        {isPendingVerification && (
          <p className="text-sm text-brown">
            Your verification is currently pending review. You cannot edit it right now.
          </p>
        )}
      </form>
    </div>
  );
}
