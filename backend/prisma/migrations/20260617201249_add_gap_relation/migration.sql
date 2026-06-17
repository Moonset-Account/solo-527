-- AddForeignKey
ALTER TABLE "GapTodo" ADD CONSTRAINT "GapTodo_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
