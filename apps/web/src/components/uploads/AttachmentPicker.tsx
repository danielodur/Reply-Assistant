import type { UploadContextSummary } from '../../uploads/uploadTypes';
import AttachmentReviewList from './AttachmentReviewList';

type AttachmentPickerProps = {
  uploads: UploadContextSummary[];
  onRemove: (id: string) => void;
};

export default function AttachmentPicker({ uploads, onRemove }: AttachmentPickerProps) {
  return <AttachmentReviewList uploads={uploads} onRemove={onRemove} />;
}
