import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '@/hooks/useGeolocation';

describe('useGeolocation', () => {
  it('sets error when geolocation not supported', () => {
    const original = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());
    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.error).toEqual({
      code: 0,
      message: 'Geolocation is not supported by this browser.'
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: original,
    });
  });

  it('calculates distance', () => {
    const { result } = renderHook(() => useGeolocation());
    const dist = result.current.calculateDistance(0, 0, 0, 1);
    expect(dist).toBeGreaterThan(0);
  });
});
