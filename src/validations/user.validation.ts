import * as yup from 'yup';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const emailRegex = /^\S+@\S+\.\S+$/;

const userTypeValues = ['staff', 'admin'] as const;

export const createUserSchema = yup.object({
    email: yup
        .string()
        .trim()
        .matches(emailRegex, 'Please enter a valid email address')
        .required('Email is required'),
    first_name: yup
        .string()
        .trim()
        .required('First name is required'),
    last_name: yup
        .string()
        .trim()
        .required('Last name is required'),
    password: yup
        .string()
        .trim()
        .matches(
            passwordRegex,
            'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number'
        )
        .required('Password is required'),
    user_type: yup
        .mixed<'staff' | 'admin'>()
        .oneOf(userTypeValues, 'User type must be either staff or admin')
        .default('staff'),
});

export const updateUserSchema = yup.object({
    username: yup
        .string()
        .trim(),
    email: yup
        .string()
        .trim()
        .matches(emailRegex, 'Please enter a valid email address'),
    first_name: yup
        .string()
        .trim(),
    last_name: yup
        .string()
        .trim(),
    password: yup
        .string()
        .trim()
        .matches(
            passwordRegex,
            'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number'
        ),
    user_type: yup
        .mixed<'staff' | 'admin'>()
        .oneOf(userTypeValues, 'User type must be either staff or admin'),
});

export const loginSchema = yup.object({
    username: yup.string().trim(),
    email: yup.string().trim().matches(emailRegex, 'Please enter a valid email address'),
    password: yup.string().trim().required('Password is required'),
}).test(
    'username-or-email',
    'Either username or email is required',
    (value) => !!(value?.username ?? value?.email),
);

export const resetPasswordSchema = yup.object({
    username: yup.string().trim(),
    email: yup.string().trim().matches(emailRegex, 'Please enter a valid email address'),
    password: yup
        .string()
        .trim()
        .matches(
            passwordRegex,
            'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number'
        )
        .required('Password is required'),
}).test(
    'username-or-email',
    'Either username or email is required',
    (value) => !!(value?.username ?? value?.email),
);

export type CreateUserInput = yup.InferType<typeof createUserSchema>;
export type UpdateUserInput = yup.InferType<typeof updateUserSchema>;
export type LoginInput = yup.InferType<typeof loginSchema>;
export type ResetPasswordInput = yup.InferType<typeof resetPasswordSchema>;
