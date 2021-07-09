import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Hack } from "./Hack";
import { User } from "./User";

@Entity()
export class Vote extends BaseEntity {
	@Column({ type: "int" })
	value: number;

	@PrimaryColumn("uuid")
	userId: string;

	@ManyToOne(() => User, (user) => user.votes)
	user: User;

	@PrimaryColumn("uuid")
	hackId: string;

	@ManyToOne(() => Hack, (hack) => hack.votes)
	hack: Hack;
}
