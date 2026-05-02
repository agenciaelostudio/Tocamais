import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import TipsSummary from '@/components/dashboard/TipsSummary';

describe('TipsSummary component', () => {
  const mockTips = [
    { id: 1, amount: 100, created_at: '2024-01-01T12:00:00Z' },
    { id: 2, amount: 250, created_at: '2024-01-02T15:30:00Z' },
    { id: 3, amount: 75, created_at: '2024-01-03T08:45:00Z' },
  ];

  it('renders correctly with provided tips', () => {
    render(<TipsSummary tips={mockTips} />);
    // verifica se título está presente
    expect(screen.getByText(/Resumo de Gorjetas/i)).toBeInTheDocument();
    // verifica se quantidade de cards corresponde ao número de tips (ou ao slice de 5)
    const tipCards = screen.getAllByTestId('tip-card');
    expect(tipCards).toHaveLength(mockTips.length);
    // verifica valores formatados
    expect(screen.getByText('R$ 100')).toBeInTheDocument();
    expect(screen.getByText('R$ 250')).toBeInTheDocument();
  });

  it('shows empty state when no tips', () => {
    render(<TipsSummary tips={[]} />);
    expect(screen.getByText(/Nenhuma gorjeta recebida ainda/i)).toBeInTheDocument();
  });
});
