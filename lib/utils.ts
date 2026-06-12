import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata valor monetário em Real brasileiro.
 * Ex: 1234.5 -> "R$ 1.234,50"
 */
export function formatCurrency(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

/**
 * Formata data ISO (YYYY-MM-DD) para exibição brasileira (DD/MM/YYYY).
 * Aceita também strings ISO completas com hora.
 */
export function formatDate(dataISO: string): string {
  const [ano, mes, dia] = dataISO.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Retorna as iniciais de um nome para avatares.
 * Ex: "João Silva" -> "JS"
 */
export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
