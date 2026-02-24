export const getTimeAgo = (date) => {
  if (!date) return 'Actualizado recientemente';

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Actualizado recientemente';
  }

  const now = new Date();
  const diffTime = Math.abs(now - parsedDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Actualizado hoy';
  if (diffDays === 1) return 'Actualizado ayer';
  if (diffDays < 7) return `Actualizado hace ${diffDays} dias`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'Actualizado hace 1 semana';
  return `Actualizado hace ${diffWeeks} semanas`;
};
