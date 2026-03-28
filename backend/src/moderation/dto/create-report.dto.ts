export class CreateReportDto {
  targetId!: string;
  targetType!: 'POST' | 'USER';
  reason!: string;
}
