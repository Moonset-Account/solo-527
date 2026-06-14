import RevisionHistory from 'App/Models/RevisionHistory'

export default class RevisionService {
  public static async log(
    entityType: string,
    entityId: number,
    beforeData: any,
    afterData: any,
    userId: number | null,
    changeDescription?: string
  ) {
    const lastRevision = await RevisionHistory.query()
      .where('entity_type', entityType)
      .where('entity_id', entityId)
      .orderBy('revision_round', 'desc')
      .first()

    const revisionRound = lastRevision ? lastRevision.revisionRound + 1 : 1

    return RevisionHistory.create({
      entityType,
      entityId,
      revisionRound,
      userId,
      beforeData: beforeData || null,
      afterData: afterData || null,
      changeDescription: changeDescription || null,
    })
  }

  public static async getHistory(entityType: string, entityId: number) {
    return RevisionHistory.query()
      .where('entity_type', entityType)
      .where('entity_id', entityId)
      .preload('operator')
      .orderBy('revision_round', 'desc')
  }

  public static async getLatestRound(entityType: string, entityId: number): Promise<number> {
    const lastRevision = await RevisionHistory.query()
      .where('entity_type', entityType)
      .where('entity_id', entityId)
      .orderBy('revision_round', 'desc')
      .first()
    return lastRevision ? lastRevision.revisionRound : 0
  }
}
