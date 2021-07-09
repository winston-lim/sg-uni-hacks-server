import { FORGET_PASSWORD_PREFIX } from "../constants";
import { User, UserRole } from "../entities/User";
import { v4 as uuidv4 } from "uuid";
import { Vote } from "../entities/Vote";

export interface ContextOptions {
	userId?: string;
	role?: UserRole;
}

export const createContext = ({ userId, role }: ContextOptions) => {
	return {
		req: {
			session: {
				userId,
				role,
				destroy: jest.fn().mockImplementation((callback: () => void) => {
					callback();
				}),
			},
		},
		res: {
			clearCookie: jest.fn(),
		},
		redis: {
			get: jest.fn().mockImplementation(async (key: string) => {
				if (key.includes(FORGET_PASSWORD_PREFIX)) {
					const token = key.replace(FORGET_PASSWORD_PREFIX, "");
					const user = await User.findOne({
						where: { changePasswordToken: token },
					});
					return user ? user.id : uuidv4();
				}
				return undefined;
			}),
			set: jest.fn().mockImplementation((key: string) => {
				if (key.includes(FORGET_PASSWORD_PREFIX)) {
					return key;
				}
				return undefined;
			}),
			del: jest.fn(),
		},
		userLoader: {
			load: jest.fn().mockImplementation((userId: string) => {
				return User.findOne(userId);
			}),
		},
		voteLoader: {
			load: jest.fn().mockImplementation(({ hackId, userId }) => {
				return Vote.findOne({ where: { hackId, userId } });
			}),
		},
	};
};
