import { User } from '@/types/auth';

export const mapUser = (data: any): User => {
    return {
        ...data,
        firstName: data.first_name || data.firstName,
        lastName: data.last_name || data.lastName,
        profileZone: data.profile_zone || data.profileZone,
        profileImage: data.profile_image !== undefined ? data.profile_image : data.profileImage,
    };
};
