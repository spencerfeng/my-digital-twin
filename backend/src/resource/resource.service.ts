import { Injectable, OnModuleInit } from "@nestjs/common"
import * as fs from "fs/promises"
import * as path from "path"
import { PDFParse } from "pdf-parse"

export interface Facts {
  full_name?: string
  name?: string
  [key: string]: unknown
}

export interface ResourceData {
  linkedin: string
  summary: string
  style: string
  facts: Facts
}

@Injectable()
export class ResourceService implements OnModuleInit {
  private dataPath: string
  public linkedin: string = ""
  public summary: string = ""
  public style: string = ""
  public facts: Facts = {}

  constructor() {
    this.dataPath = path.join(__dirname, "..", "data")
  }

  async onModuleInit() {
    await this.loadAllData()
  }

  private async loadAllData(): Promise<void> {
    // Load LinkedIn PDF
    await this.loadLinkedIn()

    // Load text files
    this.summary = await this.loadTextFile("summary.txt")
    this.style = await this.loadTextFile("style.txt")

    // Load JSON file
    this.facts = await this.loadJsonFile("facts.json")
  }

  private async loadLinkedIn(): Promise<void> {
    try {
      const pdfPath = path.join(this.dataPath, "linkedin.pdf")
      const pdfBuffer = await fs.readFile(pdfPath)
      // Convert Buffer to Uint8Array as required by pdf-parse
      const pdfUint8Array = new Uint8Array(pdfBuffer)
      const parser = new PDFParse(pdfUint8Array)
      const pdfData = await parser.getText()
      this.linkedin = (typeof pdfData === "string" ? pdfData : pdfData.text) || ""
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.linkedin = "LinkedIn profile not available"
      } else {
        throw error
      }
    }
  }

  private async loadTextFile(filename: string): Promise<string> {
    try {
      const filePath = path.join(this.dataPath, filename)
      const content = await fs.readFile(filePath, "utf-8")
      return content
    } catch (error) {
      console.error(`Error loading ${filename}:`, error)
      return ""
    }
  }

  private async loadJsonFile(filename: string): Promise<Facts> {
    try {
      const filePath = path.join(this.dataPath, filename)
      const content = await fs.readFile(filePath, "utf-8")
      return JSON.parse(content) as Facts
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(`${filename} not found, returning empty object`)
        return {}
      }
      console.error(`Error loading ${filename}:`, error)
      return {}
    }
  }

  getAllData(): ResourceData {
    return {
      linkedin: this.linkedin,
      summary: this.summary,
      style: this.style,
      facts: this.facts
    }
  }
}
