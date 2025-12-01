'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { attendanceRecordSchema } from '@/utils/validation';
import { formatMinutesToString, calculateDailyStats } from '@/utils/time-calculation';
import type { AttendanceRecord, BreakTime, WorkSpan } from '@/types';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

type AttendanceFormData = z.infer<typeof attendanceRecordSchema>;

interface AttendanceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  userId: string;
  existingRecord?: AttendanceRecord;
  onSave: (data: Omit<AttendanceRecord, 'id' | 'user_id'>) => void;
}

export function AttendanceEditModal({
  open,
  onOpenChange,
  date,
  userId,
  existingRecord,
  onSave,
}: AttendanceEditModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceRecordSchema),
    defaultValues: {
      date,
      work_spans: [{ id: uuidv4(), start_time: '09:00', end_time: '18:00' }],
      breaks: [{ start: '12:00', end: '13:00' }],
      note: '',
      work_content: '',
      status: 'pending',
    },
  });

  const { fields: workSpanFields, append: appendWorkSpan, remove: removeWorkSpan } = useFieldArray({
    control,
    name: 'work_spans',
  });

  const { fields: breakFields, append: appendBreak, remove: removeBreak } = useFieldArray({
    control,
    name: 'breaks',
  });

  const [computedValues, setComputedValues] = useState({
    workMinutes: 0,
    overtimeMinutes: 0,
    nightMinutes: 0,
  });

  // モーダルが開いたときにフォームをリセット
  useEffect(() => {
    if (open) {
      if (existingRecord) {
        reset({
          date: existingRecord.date,
          work_spans: existingRecord.work_spans,
          breaks: existingRecord.breaks,
          note: existingRecord.note,
          work_content: existingRecord.work_content,
          status: existingRecord.status,
        });
      } else {
        reset({
          date,
          work_spans: [{ id: uuidv4(), start_time: '09:00', end_time: '18:00' }],
          breaks: [{ start: '12:00', end: '13:00' }],
          note: '',
          work_content: '',
          status: 'pending',
        });
      }
    }
  }, [open, date, existingRecord, reset]);

  // リアルタイム計算: work_spans と breaks を監視
  const watchedWorkSpans = watch('work_spans');
  const watchedBreaks = watch('breaks');

  useEffect(() => {
    // 配列が存在しない場合は空配列として扱う
    const spans = watchedWorkSpans || [];
    const brks = watchedBreaks || [];

    // ★デバッグログを出す（必須）
    console.log('計算入力:', { spans, brks });

    // 入力が空の場合は0にリセット
    if (!spans || spans.length === 0) {
      console.log('勤務時間枠が未入力');
      setComputedValues({
        workMinutes: 0,
        overtimeMinutes: 0,
        nightMinutes: 0,
      });
      return;
    }

    // 即座に計算実行
    const result = calculateDailyStats(spans as WorkSpan[], brks);

    console.log('計算結果:', result);

    // 結果をセット
    setComputedValues({
      workMinutes: result.workTime,
      overtimeMinutes: result.overtime,
      nightMinutes: result.nightTime,
    });
  }, [
    // JSON.stringifyを使うことで、配列の中身（値）が変わった時だけ確実に発火させるテクニック
    JSON.stringify(watchedWorkSpans),
    JSON.stringify(watchedBreaks)
  ]);

  const onSubmit = (data: AttendanceFormData) => {
    onSave({
      date: data.date,
      work_spans: data.work_spans,
      breaks: data.breaks,
      note: data.note || '',
      work_content: data.work_content || '',
      status: data.status,
      computed_work_min: computedValues.workMinutes,
      computed_overtime_min: computedValues.overtimeMinutes,
      computed_night_min: computedValues.nightMinutes,
    });
    onOpenChange(false);
  };

  const handleDraftSave = () => {
    setValue('status', 'draft');
    handleSubmit(onSubmit)();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{date} の勤怠入力</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 勤務時間枠（複数対応） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>勤務時間枠</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendWorkSpan({ id: uuidv4(), start_time: '09:00', end_time: '18:00' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                勤務枠を追加
              </Button>
            </div>

            {workSpanFields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">勤務枠 {index + 1}</span>
                  {workSpanFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkSpan(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`work_spans.${index}.start_time`} className="text-xs">
                      出勤時刻
                    </Label>
                    <Input
                      id={`work_spans.${index}.start_time`}
                      type="time"
                      {...register(`work_spans.${index}.start_time`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`work_spans.${index}.end_time`} className="text-xs">
                      退勤時刻
                    </Label>
                    <Input
                      id={`work_spans.${index}.end_time`}
                      type="time"
                      {...register(`work_spans.${index}.end_time`)}
                    />
                  </div>
                </div>
                {/* 隠しフィールドでIDを保持 */}
                <input type="hidden" {...register(`work_spans.${index}.id`)} />
              </div>
            ))}

            {errors.work_spans && (
              <p className="text-sm text-red-600">
                {errors.work_spans.message || errors.work_spans.root?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>休憩時間</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendBreak({ start: '12:00', end: '13:00' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                休憩を追加
              </Button>
            </div>

            {breakFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  type="time"
                  {...register(`breaks.${index}.start`)}
                  className="flex-1"
                />
                <span>〜</span>
                <Input
                  type="time"
                  {...register(`breaks.${index}.end`)}
                  className="flex-1"
                />
                {breakFields.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBreak(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}

            {errors.breaks && (
              <p className="text-sm text-red-600">
                {errors.breaks.message || errors.breaks.root?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_content">業務内容</Label>
            <Textarea
              id="work_content"
              placeholder="本日の業務内容を記載してください"
              {...register('work_content')}
            />
            {errors.work_content && (
              <p className="text-sm text-red-600">{errors.work_content.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備考</Label>
            <Textarea
              id="note"
              placeholder="遅刻・早退の理由など"
              {...register('note')}
            />
            {errors.note && (
              <p className="text-sm text-red-600">{errors.note.message}</p>
            )}
          </div>

          {/* リアルタイム計算結果 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-semibold mb-2">計算結果</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">実働時間</p>
                <p className="font-bold text-lg">
                  {formatMinutesToString(computedValues.workMinutes)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">残業時間</p>
                <p className="font-bold text-lg">
                  {formatMinutesToString(computedValues.overtimeMinutes)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">深夜時間</p>
                <p className="font-bold text-lg">
                  {formatMinutesToString(computedValues.nightMinutes)}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDraftSave}
            >
              下書き保存
            </Button>
            <Button type="submit">保存して申請</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
