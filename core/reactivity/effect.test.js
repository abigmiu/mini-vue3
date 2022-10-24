import { describe, expect, it } from 'vitest';
import { reactive } from './reactive';
import { effect } from './effect';

describe('effect', () => {
    it('should observe basic properties', () => {
        let dummy;
        const counter = reactive({
            num: 0,
        });
        effect(() => dummy = counter.num + 1);

        expect(dummy).toBe(1);
        counter.num = 7;
        expect(dummy).toBe(8);
    });
});