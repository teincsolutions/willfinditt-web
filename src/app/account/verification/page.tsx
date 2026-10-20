'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import {
  useMySeller,
  useMyVerification,
  useSubmitVerification,
} from '@/hooks/useSeller';
import {
  uploadFacePhotos,
  uploadKycDocuments,
  type KycDocumentType,
} from '@/services/upload.service';
import {
  type BusinessDocument,
  type BusinessDocumentType,
  type SellerVerification,
  type VerificationType,
} from '@/services/seller.service';
import { Button } from '@/components/Button';
import { Select } from '@/components/ui/Select';
import { KycFileUploader } from '@/components/verification/KycFileUploader';
import {
  FaceCapture,
  type CapturedFace,
  type FacePose,
} from '@/components/verification/FaceCapture';

const schema = yup.object({
  verificationType: yup
    .mixed<VerificationType>()
    .oneOf(['INDIVIDUAL', 'BUSINESS'])
    .required(),
  documentType: yup
    .mixed<'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT'>()
    .oneOf(['NATIONAL_ID', 'DRIVERS_LICENSE', 'PASSPORT'])
    .required('Document type is required'),
  documentNumber: yup
    .string()
    .trim()
    .min(5, 'Enter the full document number')
    .required('Document number is required'),
  fullName: yup.string().trim().optional(),
  documentIssueDate: yup.string().optional(),
  documentExpiryDate: yup
    .string()
    .optional()
    .test('not-expired', 'This document is expired', (value) => {
      if (!value) return true;
      return new Date(value) > new Date();
    }),
  address: yup
    .string()
    .trim()
    .min(10, 'Enter your full physical address')
    .required('Address is required'),
  businessRegistrationNumber: yup.string().when('verificationType', {
    is: 'BUSINESS',
    then: (rule) =>
      rule.trim().required('Business registration number is required'),
    otherwise: (rule) => rule.trim().optional(),
  }),
  businessAddress: yup.string().when('verificationType', {
    is: 'BUSINESS',
    then: (rule) => rule.trim().required('Business address is required'),
    otherwise: (rule) => rule.trim().optional(),
  }),
  tin: yup.string().trim().optional(),
  sellerNotes: yup.string().trim().max(1000).optional(),
  consent: yup
    .boolean()
    .oneOf([true], 'Confirm the information and consent to continue')
    .required(),
});

type FormValues = yup.Asserts<typeof schema>;

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'NATIONAL_ID', label: 'Ghana Card / National ID' },
  { value: 'DRIVERS_LICENSE', label: "Driver's licence" },
  { value: 'PASSPORT', label: 'Passport' },
];

const VERIFICATION_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual seller' },
  { value: 'BUSINESS', label: 'Registered business' },
];

const BUSINESS_DOCUMENTS: Array<{
  type: BusinessDocumentType;
  label: string;
  help: string;
  required?: boolean;
}> = [
  {
    type: 'BUSINESS_REGISTRATION',
    label: 'Business registration certificate',
    help: 'Certificate of incorporation or business registration.',
    required: true,
  },
  {
    type: 'BUSINESS_LICENSE',
    label: 'Business licence',
    help: 'Business operating licence, if applicable.',
  },
  {
    type: 'TIN_CERTIFICATE',
    label: 'TIN certificate',
    help: 'Tax identification certificate, if available.',
  },
  {
    type: 'PROOF_OF_ADDRESS',
    label: 'Proof of business address',
    help: 'Utility bill or tenancy document for the business address.',
  },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending review',
  INFO_REQUESTED: 'Information requested',
  APPROVED: 'Verified',
  REJECTED: 'Not approved',
  EXPIRED: 'Verification expired',
};

function statusBadgeClass(status?: string) {
  if (status === 'APPROVED') {
    return 'bg-successLight text-success border-success/20';
  }
  if (status === 'REJECTED') {
    return 'bg-errorLight text-error border-error/20';
  }
  if (status === 'INFO_REQUESTED') {
    return 'bg-primary/10 text-primary border-primary/20';
  }
  if (status === 'PENDING') {
    return 'bg-warning/10 text-warning border-warning/20';
  }
  return 'bg-background-primary text-text-gray border-border-custom';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function uploadTypeForBusinessDocument(
  type: BusinessDocumentType
): KycDocumentType {
  return type;
}

function StepHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {step}
      </span>
      <div>
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <p className="text-sm text-text-gray">{description}</p>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  const router = useRouter();
  const { data: mySeller, isLoading: isSellerLoading } = useMySeller();
  const { data: myVerification, isLoading: isVerificationLoading } =
    useMyVerification();
  const submitMutation = useSubmitVerification();

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [businessFiles, setBusinessFiles] = useState<
    Partial<Record<BusinessDocumentType, File[]>>
  >({});
  const [faceFiles, setFaceFiles] = useState<File[]>([]);
  const [faceCaptures, setFaceCaptures] = useState<CapturedFace[]>([]);
  const [isFaceCaptureOpen, setIsFaceCaptureOpen] = useState(false);
  const [isSubmittingFiles, setIsSubmittingFiles] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      verificationType: 'INDIVIDUAL',
      documentType: 'NATIONAL_ID',
      documentNumber: '',
      fullName: '',
      documentIssueDate: '',
      documentExpiryDate: '',
      address: '',
      businessRegistrationNumber: '',
      businessAddress: '',
      tin: '',
      sellerNotes: '',
      consent: false,
    },
  });

  const verificationType = watch('verificationType');
  const isBusiness = verificationType === 'BUSINESS';

  useEffect(() => {
    if (!myVerification) return;
    reset({
      verificationType: myVerification.verificationType || 'INDIVIDUAL',
      documentType: myVerification.documentType,
      documentNumber: myVerification.documentNumber,
      fullName: myVerification.fullName || '',
      documentIssueDate: myVerification.documentIssueDate?.slice(0, 10) || '',
      documentExpiryDate: myVerification.documentExpiryDate?.slice(0, 10) || '',
      address: myVerification.address,
      businessRegistrationNumber:
        myVerification.businessRegistrationNumber || '',
      businessAddress: myVerification.businessAddress || '',
      tin: myVerification.tin || '',
      sellerNotes: myVerification.sellerNotes || '',
      consent: myVerification.status === 'INFO_REQUESTED',
    });
  }, [myVerification, reset]);

  const status = myVerification?.status;
  const isPending = status === 'PENDING' && !myVerification?.infoRequestedAt;
  const isApproved = status === 'APPROVED';
  const canEdit = !isPending && !isApproved;

  const existingBusinessDocuments = useMemo(() => {
    const map = new Map<BusinessDocumentType, string>();
    for (const document of myVerification?.businessDocuments || []) {
      map.set(document.type, document.url);
    }
    return map;
  }, [myVerification?.businessDocuments]);

  const faceReady = useMemo(() => {
    if (faceCaptures.length === 3) return true;
    if (faceFiles.length === 3) return true;
    return Boolean(myVerification?.facePhoto?.length === 3);
  }, [faceCaptures.length, faceFiles.length, myVerification?.facePhoto]);

  const facePreviews = useMemo(
    () =>
      faceCaptures.map((capture) => ({
        ...capture,
        previewUrl: URL.createObjectURL(capture.file),
      })),
    [faceCaptures]
  );

  useEffect(() => {
    return () => {
      facePreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.previewUrl)
      );
    };
  }, [facePreviews]);

  const onSubmit = async (values: FormValues) => {
    if (!mySeller?.id) {
      toast.error('Create a business profile before submitting verification.');
      return;
    }

    if (!canEdit) {
      toast.error('This verification cannot be edited right now.');
      return;
    }

    if (
      faceCaptures.length !== 3 &&
      faceFiles.length !== 3 &&
      !(myVerification?.facePhoto?.length === 3)
    ) {
      toast.error('Complete three face captures (front, left, right).');
      return;
    }

    if (values.verificationType === 'BUSINESS') {
      const hasRegistration =
        (businessFiles.BUSINESS_REGISTRATION?.length || 0) > 0 ||
        existingBusinessDocuments.has('BUSINESS_REGISTRATION');
      if (!hasRegistration) {
        toast.error('Upload a business registration certificate.');
        return;
      }
    }

    setIsSubmittingFiles(true);
    try {
      let documentUrls = documentFiles.length
        ? await uploadKycDocuments(
            documentFiles,
            values.documentType as KycDocumentType
          )
        : myVerification?.documents || [];

      if (!documentUrls.length) {
        toast.error('Upload at least one identity document.');
        return;
      }

      const businessDocuments: BusinessDocument[] = [];
      for (const document of BUSINESS_DOCUMENTS) {
        const selected = businessFiles[document.type];
        if (selected?.length) {
          const urls = await uploadKycDocuments(
            selected,
            uploadTypeForBusinessDocument(document.type)
          );
          if (urls[0]) {
            businessDocuments.push({
              type: document.type,
              url: urls[0],
              label: document.label,
            });
          }
        } else {
          const existingUrl = existingBusinessDocuments.get(document.type);
          if (existingUrl) {
            businessDocuments.push({
              type: document.type,
              url: existingUrl,
              label: document.label,
            });
          }
        }
      }

      let faceUrls: string[] = [];
      let faceCaptureMetadata: Record<string, unknown> | undefined;

      if (faceCaptures.length === 3) {
        faceUrls = await uploadFacePhotos(
          faceCaptures.map((capture) => capture.file)
        );
        faceCaptureMetadata = {
          engine: 'mediapipe-face-landmarker',
          modelVersion: '1.1.1',
          livenessModel: 'minifas-quantized-onnx',
          poses: faceCaptures.map((capture) => ({
            pose: capture.pose,
            yaw: capture.yaw,
            pitch: capture.pitch,
            roll: capture.roll,
            livenessScore: capture.livenessScore,
            capturedAt: capture.capturedAt,
          })),
        };
      } else if (faceFiles.length === 3) {
        faceUrls = await uploadFacePhotos(faceFiles);
        faceCaptureMetadata = {
          engine: 'photo-upload',
          poses: (['CENTER', 'LEFT', 'RIGHT'] as FacePose[]).map((pose) => ({
            pose,
          })),
        };
      } else {
        faceUrls = myVerification?.facePhoto || [];
      }

      if (faceUrls.length !== 3) {
        toast.error('Three face captures are required.');
        return;
      }

      await submitMutation.mutateAsync({
        verificationType: values.verificationType,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        fullName: values.fullName || undefined,
        documentIssueDate: values.documentIssueDate || undefined,
        documentExpiryDate: values.documentExpiryDate || undefined,
        address: values.address,
        documents: documentUrls,
        businessRegistrationNumber:
          values.businessRegistrationNumber || undefined,
        businessAddress: values.businessAddress || undefined,
        tin: values.tin || undefined,
        businessDocuments:
          values.verificationType === 'BUSINESS'
            ? businessDocuments
            : undefined,
        facePhoto: faceUrls,
        faceCapture: faceCaptureMetadata,
        sellerNotes: values.sellerNotes || undefined,
        consent: values.consent,
      });

      setDocumentFiles([]);
      setBusinessFiles({});
      setFaceFiles([]);
      setFaceCaptures([]);
      toast.success(
        myVerification
          ? 'Verification updated and resubmitted.'
          : 'Verification submitted for review.'
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Could not submit verification.'
      );
    } finally {
      setIsSubmittingFiles(false);
    }
  };

  if (isSellerLoading || isVerificationLoading) {
    return (
      <div className="py-10 text-center text-text-gray">
        Loading verification...
      </div>
    );
  }

  if (!mySeller) {
    return (
      <div className="mx-auto max-w-2xl py-14 text-center">
        <h2 className="mb-3 text-2xl font-bold text-text">
          No business profile found
        </h2>
        <p className="mb-6 text-text-gray">
          Create your business profile before submitting verification.
        </p>
        <Button onClick={() => router.push('/account/business/edit')}>
          Create business profile
        </Button>
      </div>
    );
  }

  const isBusy = submitMutation.isPending || isSubmittingFiles;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Seller verification</h2>
          <p className="mt-1 text-text-gray">
            Verify your identity and business to earn a verified seller badge.
          </p>
        </div>
        <Link
          href="/account/business"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to business profile
        </Link>
      </div>

      <VerificationStatusCard
        verification={myVerification}
        status={status}
        isPending={isPending}
      />

      {canEdit && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <section className="space-y-5 rounded-2xl border border-border-custom bg-background p-5">
            <StepHeader
              step={1}
              title="Identity details"
              description="Use a valid government-issued ID in your own name."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Verification type
                </label>
                <Controller
                  control={control}
                  name="verificationType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={VERIFICATION_TYPE_OPTIONS}
                      disabled={isBusy}
                    />
                  )}
                />
                {errors.verificationType && (
                  <p className="mt-1 text-sm text-error">
                    {errors.verificationType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Document type
                </label>
                <Controller
                  control={control}
                  name="documentType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={DOCUMENT_TYPE_OPTIONS}
                      disabled={isBusy}
                    />
                  )}
                />
                {errors.documentType && (
                  <p className="mt-1 text-sm text-error">
                    {errors.documentType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Document number
                </label>
                <input
                  {...register('documentNumber')}
                  disabled={isBusy}
                  className="min-h-11 w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  placeholder="Enter the number on the document"
                />
                {errors.documentNumber && (
                  <p className="mt-1 text-sm text-error">
                    {errors.documentNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Full name on document
                </label>
                <input
                  {...register('fullName')}
                  disabled={isBusy}
                  className="min-h-11 w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  placeholder="As written on the ID"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Issue date
                </label>
                <input
                  type="date"
                  {...register('documentIssueDate')}
                  disabled={isBusy}
                  className="min-h-11 w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Expiry date
                </label>
                <input
                  type="date"
                  {...register('documentExpiryDate')}
                  disabled={isBusy}
                  className="min-h-11 w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
                {errors.documentExpiryDate && (
                  <p className="mt-1 text-sm text-error">
                    {errors.documentExpiryDate.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Residential address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                disabled={isBusy}
                className="w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                placeholder="Street, area, city, region"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-error">
                  {errors.address.message}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border-custom bg-background p-5">
            <StepHeader
              step={2}
              title="Identity documents"
              description="Upload a clear photo or PDF of the front and back where applicable."
            />
            <KycFileUploader
              label="Identity document files"
              help="JPG, PNG or PDF. Up to 5 files, 10 MB each."
              maxFiles={5}
              files={documentFiles}
              onChange={setDocumentFiles}
              disabled={isBusy}
              existingUrls={myVerification?.documents || []}
            />
          </section>

          {isBusiness && (
            <section className="space-y-4 rounded-2xl border border-border-custom bg-background p-5">
              <StepHeader
                step={3}
                title="Business details"
                description="These documents let us verify the registered business."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Business registration number
                  </label>
                  <input
                    {...register('businessRegistrationNumber')}
                    disabled={isBusy}
                    className="min-h-11 w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                  {errors.businessRegistrationNumber && (
                    <p className="mt-1 text-sm text-error">
                      {errors.businessRegistrationNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    TIN (optional)
                  </label>
                  <input
                    {...register('tin')}
                    disabled={isBusy}
                    className="min-h-11 w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Business address
                </label>
                <textarea
                  {...register('businessAddress')}
                  rows={2}
                  disabled={isBusy}
                  className="w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                />
                {errors.businessAddress && (
                  <p className="mt-1 text-sm text-error">
                    {errors.businessAddress.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {BUSINESS_DOCUMENTS.map((document) => (
                  <KycFileUploader
                    key={document.type}
                    label={`${document.label}${document.required ? ' *' : ''}`}
                    help={document.help}
                    maxFiles={1}
                    files={businessFiles[document.type] || []}
                    onChange={(files) =>
                      setBusinessFiles((current) => ({
                        ...current,
                        [document.type]: files,
                      }))
                    }
                    disabled={isBusy}
                    existingUrls={
                      existingBusinessDocuments.has(document.type)
                        ? [existingBusinessDocuments.get(document.type)!]
                        : []
                    }
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4 rounded-2xl border border-border-custom bg-background p-5">
            <StepHeader
              step={isBusiness ? 4 : 3}
              title="Face verification"
              description="Complete three live captures: front, left and right."
            />

            <div className="flex flex-col gap-3 rounded-xl border border-border-custom bg-background-primary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-text">
                  {faceCaptures.length === 3
                    ? 'Face captures ready'
                    : faceFiles.length === 3
                      ? 'Face photos selected'
                      : 'Use your camera for a liveness check'}
                </p>
                <p className="text-xs text-text-gray">
                  On-device checks help us confirm a real person is present.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFaceCaptureOpen(true)}
                disabled={isBusy}
              >
                {faceCaptures.length === 3 ? 'Retake captures' : 'Start camera'}
              </Button>
            </div>

            {faceCaptures.length === 3 && (
              <div className="grid grid-cols-3 gap-2">
                {facePreviews.map((capture) => (
                  <div
                    key={capture.pose}
                    className="overflow-hidden rounded-lg border border-border-custom"
                  >
                    <img
                      src={capture.previewUrl}
                      alt={capture.pose}
                      className="h-24 w-full object-cover"
                    />
                    <p className="px-2 py-1 text-center text-xs text-text-gray">
                      {capture.pose}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <details className="rounded-xl border border-border-custom bg-background-primary/20 p-4">
              <summary className="cursor-pointer text-sm font-medium text-text">
                Camera not working? Upload three face photos instead
              </summary>
              <div className="mt-3">
                <KycFileUploader
                  label="Face photos"
                  help="Front, left and right. JPG or PNG, up to 10 MB each."
                  accept="image/jpeg,image/png"
                  maxFiles={3}
                  files={faceFiles}
                  onChange={(files) => {
                    setFaceFiles(files);
                    if (files.length) setFaceCaptures([]);
                  }}
                  disabled={isBusy}
                  existingUrls={myVerification?.facePhoto || []}
                />
              </div>
            </details>

            {!faceReady && (
              <p className="text-sm text-warning">
                Three face captures or three face photos are required.
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-border-custom bg-background p-5">
            <StepHeader
              step={isBusiness ? 5 : 4}
              title="Review and consent"
              description="Check your details before submitting."
            />
            <div className="rounded-xl border border-border-custom bg-background-primary/20 p-4 text-sm text-text-gray">
              <p>
                <span className="font-medium text-text">Type:</span>{' '}
                {verificationType === 'BUSINESS'
                  ? 'Registered business'
                  : 'Individual seller'}
              </p>
              <p>
                <span className="font-medium text-text">Document:</span>{' '}
                {watch('documentType').replaceAll('_', ' ').toLowerCase()}
              </p>
              <p>
                <span className="font-medium text-text">Documents:</span>{' '}
                {documentFiles.length || myVerification?.documents?.length || 0}{' '}
                file(s)
              </p>
              <p>
                <span className="font-medium text-text">Face captures:</span>{' '}
                {faceCaptures.length ||
                  faceFiles.length ||
                  myVerification?.facePhoto?.length ||
                  0}{' '}
                of 3
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Notes for the reviewer (optional)
              </label>
              <textarea
                {...register('sellerNotes')}
                rows={3}
                disabled={isBusy}
                className="w-full rounded-xl border border-border-custom bg-background-primary/30 px-4 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                placeholder="Anything the reviewer should know"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-text-gray">
              <input
                type="checkbox"
                {...register('consent')}
                disabled={isBusy}
                className="mt-1 h-4 w-4 rounded border-border-custom text-primary focus:ring-primary"
              />
              <span>
                I confirm the information is accurate and consent to WillfindITT
                processing my identity and business documents for verification.
              </span>
            </label>
            {errors.consent && (
              <p className="text-sm text-error">{errors.consent.message}</p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/account/business')}
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBusy || !faceReady}>
                {isBusy
                  ? 'Submitting...'
                  : myVerification
                    ? 'Resubmit verification'
                    : 'Submit verification'}
              </Button>
            </div>
          </section>
        </form>
      )}

      <FaceCapture
        open={isFaceCaptureOpen}
        onClose={() => setIsFaceCaptureOpen(false)}
        onComplete={(captures) => {
          setFaceCaptures(captures);
          setFaceFiles([]);
          setIsFaceCaptureOpen(false);
        }}
      />
    </div>
  );
}

function VerificationStatusCard({
  verification,
  status,
  isPending,
}: {
  verification?: SellerVerification;
  status?: string;
  isPending: boolean;
}) {
  if (!verification) {
    return (
      <div className="rounded-2xl border border-border-custom bg-background p-4">
        <p className="text-sm font-semibold text-text">Not submitted yet</p>
        <p className="mt-1 text-sm text-text-gray">
          Complete the steps below. Most reviews are completed within 24–72
          hours.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-custom bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
            status
          )}`}
        >
          {STATUS_LABELS[status || ''] || status}
        </span>
        <span className="text-sm text-text-gray">
          {verification.verificationType === 'BUSINESS'
            ? 'Business verification'
            : 'Individual verification'}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-text-gray sm:grid-cols-2">
        <p>
          <span className="font-medium text-text">Submitted:</span>{' '}
          {formatDate(verification.submittedAt)}
        </p>
        <p>
          <span className="font-medium text-text">Reviewed:</span>{' '}
          {formatDate(verification.reviewedAt)}
        </p>
        {verification.expiresAt && (
          <p>
            <span className="font-medium text-text">Expires:</span>{' '}
            {formatDate(verification.expiresAt)}
          </p>
        )}
      </div>

      {status === 'PENDING' && isPending && (
        <p className="mt-3 rounded-xl bg-warning/10 p-3 text-sm text-warning">
          Your verification is pending review. You cannot edit it until the
          review is complete. Expected time: 24–72 hours.
        </p>
      )}

      {status === 'INFO_REQUESTED' && verification.infoRequestMessage && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-text">
          <p className="font-semibold text-primary">More information needed</p>
          <p className="mt-1">{verification.infoRequestMessage}</p>
          <p className="mt-2 text-text-gray">
            Update the requested information below and resubmit.
          </p>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="mt-3 rounded-xl border border-error/20 bg-errorLight p-3 text-sm text-error">
          <p className="font-semibold">Verification not approved</p>
          {verification.decisionReason && (
            <p className="mt-1">Reason: {verification.decisionReason}</p>
          )}
          {verification.recommendations && (
            <p className="mt-1">
              Recommendation: {verification.recommendations}
            </p>
          )}
          <p className="mt-2">
            Update your documents or details below and resubmit.
          </p>
        </div>
      )}

      {status === 'APPROVED' && (
        <p className="mt-3 rounded-xl bg-successLight p-3 text-sm text-success">
          Your seller verification is approved. Your verified badge is now
          visible on your public profile.
        </p>
      )}

      {status === 'EXPIRED' && (
        <p className="mt-3 rounded-xl bg-background-primary p-3 text-sm text-text-gray">
          Your verification has expired. Submit updated documents to renew it.
        </p>
      )}
    </div>
  );
}
