
export interface UserType {

    id?: string,

    name: string,
    email: string,
    password: string,
    role: number,

    updatedAt?: string,
    createdAt?: string,
}

export const EMPTY_USER = {

    id: undefined,

    name: '',

    updatedAt: undefined,
    createdAt: undefined,

}
