// models/BulkAction.ts
export interface BulkAction {
  label: string;       // Текст кнопки
  icon: string;        // Иконка (например, 'pi pi-check')
  
  // severity позволяет использовать стандартные цвета PrimeNG:
  // 'success' (зеленый), 'danger' (красный), 'info' (синий), 
  // 'secondary' (серый)
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
  
  // Сама функция, которая выполнится при клике
  execute: (ids: string[]) => void;
}