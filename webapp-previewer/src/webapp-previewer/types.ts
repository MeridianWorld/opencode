/**
 * Type definitions for WebApp Previewer
 */

export interface WebAppPreviewState {
  /**
   * Whether the preview panel is open
   */
  isOpen: boolean
  
  /**
   * Currently previewed file path
   */
  filePath: string | null
  
  /**
   * Preview URL for the iframe
   */
  previewUrl: string | null
  
  /**
   * Device mode for responsive preview
   */
  deviceMode: DeviceMode
  
  /**
   * List of detected web application files
   */
  detectedFiles: DetectedFile[]
  
  /**
   * Whether auto-preview is enabled
   */
  autoPreview: boolean
}

export type DeviceMode = "desktop" | "tablet" | "mobile"

export interface DetectedFile {
  /**
   * Absolute file path
   */
  path: string
  
  /**
   * Relative path from project root
   */
  relativePath: string
  
  /**
   * File name
   */
  name: string
  
  /**
   * File type (html, css, js, etc.)
   */
  type: string
  
  /**
   * Last modified timestamp
   */
  lastModified: number
  
  /**
   * Whether this file is currently being previewed
   */
  isActive: boolean
}

export interface WebAppPreviewConfig {
  /**
   * Backend server URL
   */
  backendUrl: string
  
  /**
   * Project directory path
   */
  projectDirectory: string
  
  /**
   * Auto-preview enabled
   */
  autoPreview?: boolean
}
