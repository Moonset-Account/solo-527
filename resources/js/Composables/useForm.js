import { reactive, ref, computed } from 'vue';

export function useForm(initialData = {}) {
    const data = reactive({ ...initialData });
    const errors = reactive({});
    const isSubmitting = ref(false);
    const isDirty = ref(false);
    const recentlySuccessful = ref(false);

    const hasErrors = computed(() => Object.keys(errors).length > 0);

    const reset = (...fields) => {
        if (fields.length === 0) {
            Object.keys(initialData).forEach(key => {
                data[key] = initialData[key];
            });
        } else {
            fields.forEach(field => {
                if (initialData.hasOwnProperty(field)) {
                    data[field] = initialData[field];
                }
            });
        }
        isDirty.value = false;
    };

    const clearErrors = (...fields) => {
        if (fields.length === 0) {
            Object.keys(errors).forEach(key => {
                delete errors[key];
            });
        } else {
            fields.forEach(field => {
                delete errors[field];
            });
        }
    };

    const setError = (field, message) => {
        errors[field] = message;
    };

    const setErrors = (newErrors) => {
        Object.keys(newErrors).forEach(key => {
            errors[key] = newErrors[key];
        });
    };

    const setData = (newData) => {
        Object.keys(newData).forEach(key => {
            data[key] = newData[key];
        });
        isDirty.value = true;
    };

    const transform = (callback) => {
        return callback(data);
    };

    const submit = async (callback, options = {}) => {
        isSubmitting.value = true;
        clearErrors();

        try {
            const result = await callback(data);
            isSubmitting.value = false;
            recentlySuccessful.value = true;

            if (options.resetOnSuccess !== false) {
                setTimeout(() => {
                    recentlySuccessful.value = false;
                }, 2000);
            }

            return result;
        } catch (error) {
            isSubmitting.value = false;

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }

            throw error;
        }
    };

    const processing = computed(() => isSubmitting.value);
    const successful = computed(() => recentlySuccessful.value);

    return {
        data,
        errors,
        isSubmitting,
        isDirty,
        hasErrors,
        recentlySuccessful,
        processing,
        successful,
        reset,
        clearErrors,
        setError,
        setErrors,
        setData,
        transform,
        submit,
    };
}
