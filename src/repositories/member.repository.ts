import { IRepository } from "../core/repository";
import { IMember } from "../models/member.model";
import { MemberBaseSchema, IMemberBase } from "../models/member.schema";
import { MySql2Database } from "drizzle-orm/mysql2";
import { members } from "../orm/schema";
import { count, eq, like, or, sql } from "drizzle-orm";
import { IPagedResponse, IPageRequest } from "../core/pagination";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  constructor(private readonly db: MySql2Database<Record<string, never>>) {}

  async create(data: IMemberBase): Promise<IMember> {
    const validatedData = MemberBaseSchema.parse(data);

    try {
      const [insertId] = await this.db
        .insert(members)
        .values(validatedData)
        .$returningId();

      return await this.getById(insertId.id);
    } catch (error) {
      throw new Error(`Error creating member: ${(error as Error).message}`);
    }
  }

  async update(id: number, data: IMemberBase): Promise<IMember> {
    const memberToUpdate = await this.getById(id);
    if (!memberToUpdate) {
      throw new Error("Member not found");
    }

    const validatedData = MemberBaseSchema.parse(data);
    const updatedMember: IMember = {
      ...memberToUpdate,
      ...validatedData,
    };

    try {
      const [result] = await this.db
        .update(members)
        .set(updatedMember)
        .where(eq(members.id, id))
        .execute();
      if (result.affectedRows > 0) {
        return await this.getById(id);
      } else {
        throw new Error("Could not update member");
      }
    } catch (error) {
      throw new Error("Could not update member");
    }
  }

  async delete(id: number): Promise<IMember> {
    const memberToDelete = await this.getById(id);
    if (!memberToDelete) {
      throw new Error("Member not found");
    }

    try {
      const [result] = await this.db
        .delete(members)
        .where(eq(members.id, id))
        .execute();
      if (result.affectedRows > 0) {
        return memberToDelete;
      } else {
        throw new Error(`Member deletion failed`);
      }
    } catch (error) {
      throw new Error(`Member deletion failed`);
    }
  }

  async getById(id: number): Promise<IMember> {
    try {
      const [member] = (await this.db
        .select()
        .from(members)
        .where(eq(members.id, id))
        .limit(1)
        .execute()) as IMember[];
      if (!member) {
        throw new Error("Member not found");
      }
      return member;
    } catch (error) {
      throw new Error(`Member not found`);
    }
  }

  async list(
    params: IPageRequest
  ): Promise<IPagedResponse<IMember> | undefined> {
    let searchWhereClause;

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      searchWhereClause = sql`${members.name} LIKE ${search} OR ${members.phoneNumber} LIKE ${search}`;
    }

    try {
      const matchedMembers = (await this.db
        .select()
        .from(members)
        .where(searchWhereClause)
        .offset(params.offset)
        .limit(params.limit)) as IMember[];

      if (matchedMembers.length > 0) {
        const [totalMatchedMembers] = await this.db
          .select({ count: count() })
          .from(members)
          .where(searchWhereClause);

        return {
          items: matchedMembers,
          pagination: {
            offset: params.offset,
            limit: params.limit,
            total: totalMatchedMembers.count,
          },
        };
      } else {
        throw new Error("No members found matching the criteria");
      }
    } catch (e) {
      throw new Error((e as Error).message);
    }
  }
}
