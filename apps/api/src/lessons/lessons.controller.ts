import { Controller, Get, Param } from "@nestjs/common";
import { LessonsService } from "./lessons.service";

@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  findAll() {
    return this.lessonsService.findAll();
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.lessonsService.findOne(slug);
  }
}
