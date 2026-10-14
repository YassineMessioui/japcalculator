import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import App from './App';

// jest.mock("mapbox-gl", () => {
//   return {
//     Map: function() {
//       (this as any).on = jest.fn();
//     },
//     Marker: function() {
//       (this as any).setLngLat = function() {
//         return this;
//       };
//       (this as any).addTo = jest.fn();
//     }
//   };
// });

test('renders App', () => {
  const { baseElement } = render(<App />);
  expect(baseElement).toBeDefined();
});

test('reset selections clears every quantity and the calorie total', () => {
  const { container, getByText } = render(<App />);
  const quantities = container.querySelectorAll('input[type="number"]');
  const resetButton = getByText('Reset selections').closest(
    'button'
  ) as HTMLButtonElement;

  fireEvent.change(quantities[0], { target: { value: '2' } });
  fireEvent.change(quantities[1], { target: { value: '3' } });
  expect(getByText('150 Kcal')).toBeInTheDocument();

  fireEvent.click(resetButton);

  quantities.forEach(quantity => expect(quantity).toHaveValue(0));
  expect(getByText('0 Kcal')).toBeInTheDocument();
  expect(resetButton).toBeDisabled();
});
