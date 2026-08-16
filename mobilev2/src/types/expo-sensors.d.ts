/**
 * Type declarations for expo-sensors
 * Add this file to: src/types/expo-sensors.d.ts
 */

declare module 'expo-sensors' {
  export interface ThreeAxisMeasurement {
    x: number;
    y: number;
    z: number;
  }

  export interface Subscription {
    remove: () => void;
  }

  export class Magnetometer {
    static isAvailableAsync(): Promise<boolean>;
    static addListener(listener: (data: ThreeAxisMeasurement) => void): Subscription;
    static removeAllListeners(): void;
    static setUpdateInterval(intervalMs: number): void;
  }

  export class Accelerometer {
    static isAvailableAsync(): Promise<boolean>;
    static addListener(listener: (data: ThreeAxisMeasurement) => void): Subscription;
    static removeAllListeners(): void;
    static setUpdateInterval(intervalMs: number): void;
  }

  export class Gyroscope {
    static isAvailableAsync(): Promise<boolean>;
    static addListener(listener: (data: ThreeAxisMeasurement) => void): Subscription;
    static removeAllListeners(): void;
    static setUpdateInterval(intervalMs: number): void;
  }

  export class DeviceMotion {
    static isAvailableAsync(): Promise<boolean>;
    static addListener(listener: (data: any) => void): Subscription;
    static removeAllListeners(): void;
    static setUpdateInterval(intervalMs: number): void;
  }

  export class Barometer {
    static isAvailableAsync(): Promise<boolean>;
    static addListener(listener: (data: { pressure: number; relativeAltitude?: number }) => void): Subscription;
    static removeAllListeners(): void;
    static setUpdateInterval(intervalMs: number): void;
  }

  export class Pedometer {
    static isAvailableAsync(): Promise<boolean>;
    static watchStepCount(callback: (result: { steps: number }) => void): Subscription;
    static getStepCountAsync(start: Date, end: Date): Promise<{ steps: number }>;
  }

  export class LightSensor {
    static isAvailableAsync(): Promise<boolean>;
    static addListener(listener: (data: { illuminance: number }) => void): Subscription;
    static removeAllListeners(): void;
    static setUpdateInterval(intervalMs: number): void;
  }
}